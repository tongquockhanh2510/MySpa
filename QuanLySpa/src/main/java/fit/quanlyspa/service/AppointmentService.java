package fit.quanlyspa.service;

import fit.quanlyspa.dto.request.appointment.AppointmentDetailRequest;
import fit.quanlyspa.dto.request.appointment.AppointmentRequest;
import fit.quanlyspa.dto.response.PagedResponse;
import fit.quanlyspa.entity.*;
import fit.quanlyspa.enums.StatusOfAppointment;
import fit.quanlyspa.enums.StatusOfEmployee;
import fit.quanlyspa.enums.StatusOfService;
import fit.quanlyspa.exception.AppException;
import fit.quanlyspa.exception.ErrorCode;
import fit.quanlyspa.repository.*;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@org.springframework.stereotype.Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AppointmentService {

    AppointmentRepository appointmentRepository;
    CustomerRepository customerRepository;
    EmployeeRepository employeeRepository;
    ServiceRepository serviceRepository;
    AppoinmentDetailRepository appointmentDetailRepository;

    // ===== STATE TRANSITION MAP =====
    private static final Map<StatusOfAppointment, Set<StatusOfAppointment>> VALID_TRANSITIONS = Map.of(
            StatusOfAppointment.PENDING,   Set.of(StatusOfAppointment.CONFIRMED, StatusOfAppointment.CANCELLED, StatusOfAppointment.RESCHEDULED),
            StatusOfAppointment.CONFIRMED, Set.of(StatusOfAppointment.CHECKED_IN, StatusOfAppointment.CANCELLED, StatusOfAppointment.RESCHEDULED, StatusOfAppointment.NO_SHOW),
            StatusOfAppointment.CHECKED_IN,Set.of(StatusOfAppointment.WAITING, StatusOfAppointment.IN_PROGRESS),
            StatusOfAppointment.WAITING,   Set.of(StatusOfAppointment.IN_PROGRESS, StatusOfAppointment.CANCELLED),
            StatusOfAppointment.IN_PROGRESS,Set.of(StatusOfAppointment.COMPLETED),
            StatusOfAppointment.COMPLETED, Set.of(),
            StatusOfAppointment.CANCELLED, Set.of(),
            StatusOfAppointment.NO_SHOW,   Set.of(),
            StatusOfAppointment.RESCHEDULED,Set.of()
    );

    // ===== CREATE APPOINTMENT =====
    @Transactional
    public Appointment create(AppointmentRequest request, String createdBy) {

        // Business Rule: Appointment must be at least 30 minutes in the future
        if (request.getDateTime().isBefore(LocalDateTime.now().plusMinutes(30))) {
            throw new AppException(ErrorCode.APPOINTMENT_TOO_SOON);
        }

        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new AppException(ErrorCode.CUSTOMER_NOT_FOUND));

        // Calculate end time from total service duration
        double totalDuration = calculateTotalDuration(request.getDetails());
        LocalDateTime endTime = request.getDateTime().plusMinutes((long) totalDuration);

        // Business Rule: Customer cannot have overlapping appointments
        List<Appointment> customerConflicts = appointmentRepository.findOverlappingForCustomer(
                customer.getCustomerId(), request.getDateTime(), endTime, null);
        if (!customerConflicts.isEmpty()) {
            throw new AppException(ErrorCode.APPOINTMENT_TIME_CONFLICT);
        }

        // Build appointment
        Appointment appointment = Appointment.builder()
                .customer(customer)
                .dateTime(request.getDateTime())
                .endTime(endTime)
                .statusOfAppointment(StatusOfAppointment.PENDING)
                .note(request.getNote())
                .createdBy(createdBy)
                .build();

        // Assign room if provided
        if (request.getRoomId() != null) {
            // Business Rule: Room cannot be double-booked
            appointmentRepository.findRoomConflicts(request.getRoomId(), request.getDateTime(), endTime, null)
                    .stream().findAny().ifPresent(c -> {
                        throw new AppException(ErrorCode.APPOINTMENT_ROOM_CONFLICT);
                    });
        }

        appointment = appointmentRepository.save(appointment);

        // Create appointment details (service + therapist assignments)
        List<AppoinmentDetail> details = buildDetails(appointment, request.getDetails());
        appointmentDetailRepository.saveAll(details);
        appointment.setDetails(details);

        log.info("Appointment created: {} for customer {}", appointment.getAppointmentId(), customer.getName());
        return appointment;
    }

    // ===== STATE TRANSITIONS =====

    @Transactional
    public Appointment confirm(String appointmentId) {
        return transition(appointmentId, StatusOfAppointment.CONFIRMED);
    }

    @Transactional
    public Appointment checkIn(String appointmentId) {
        Appointment appointment = transition(appointmentId, StatusOfAppointment.CHECKED_IN);
        appointment.setCheckedInAt(LocalDateTime.now());
        return appointmentRepository.save(appointment);
    }

    @Transactional
    public Appointment startTreatment(String appointmentId) {
        return transition(appointmentId, StatusOfAppointment.IN_PROGRESS);
    }

    @Transactional
    public Appointment complete(String appointmentId) {
        Appointment appointment = transition(appointmentId, StatusOfAppointment.COMPLETED);
        appointment.setCompletedAt(LocalDateTime.now());
        return appointmentRepository.save(appointment);
    }

    @Transactional
    public Appointment cancel(String appointmentId, String reason) {
        Appointment appointment = findById(appointmentId);

        // Business Rule: Cannot cancel IN_PROGRESS or COMPLETED appointments
        if (appointment.getStatusOfAppointment() == StatusOfAppointment.IN_PROGRESS ||
            appointment.getStatusOfAppointment() == StatusOfAppointment.COMPLETED) {
            throw new AppException(ErrorCode.APPOINTMENT_CANNOT_CANCEL);
        }

        validateTransition(appointment.getStatusOfAppointment(), StatusOfAppointment.CANCELLED);
        appointment.setStatusOfAppointment(StatusOfAppointment.CANCELLED);
        appointment.setCancelReason(reason);
        appointment.setCancelledAt(LocalDateTime.now());
        log.info("Appointment {} cancelled: {}", appointmentId, reason);
        return appointmentRepository.save(appointment);
    }

    @Transactional
    public Appointment markNoShow(String appointmentId) {
        return transition(appointmentId, StatusOfAppointment.NO_SHOW);
    }

    @Transactional
    public Appointment reschedule(String appointmentId, LocalDateTime newDateTime) {
        Appointment appointment = findById(appointmentId);
        validateTransition(appointment.getStatusOfAppointment(), StatusOfAppointment.RESCHEDULED);

        // Business Rule: New time must also be in future
        if (newDateTime.isBefore(LocalDateTime.now().plusMinutes(30))) {
            throw new AppException(ErrorCode.APPOINTMENT_TOO_SOON);
        }

        // Check for conflicts with new time
        double totalDuration = appointment.getDetails().stream()
                .mapToDouble(d -> d.getService().getDuration()).sum();
        LocalDateTime newEndTime = newDateTime.plusMinutes((long) totalDuration);

        List<Appointment> conflicts = appointmentRepository.findOverlappingForCustomer(
                appointment.getCustomer().getCustomerId(), newDateTime, newEndTime, appointmentId);
        if (!conflicts.isEmpty()) {
            throw new AppException(ErrorCode.APPOINTMENT_TIME_CONFLICT);
        }

        appointment.setRescheduledTo(newDateTime);
        appointment.setStatusOfAppointment(StatusOfAppointment.RESCHEDULED);
        appointment.setDateTime(newDateTime);
        appointment.setEndTime(newEndTime);
        log.info("Appointment {} rescheduled to {}", appointmentId, newDateTime);
        return appointmentRepository.save(appointment);
    }

    // ===== AUTO NO-SHOW JOB (called by scheduler) =====
    @Transactional
    public int autoMarkNoShow() {
        // Appointments that were PENDING/CONFIRMED more than 30 min ago
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(30);
        List<Appointment> overdue = appointmentRepository.findOverdueAppointments(cutoff);
        overdue.forEach(a -> {
            a.setStatusOfAppointment(StatusOfAppointment.NO_SHOW);
            log.info("Auto no-show: appointment {}", a.getAppointmentId());
        });
        appointmentRepository.saveAll(overdue);
        return overdue.size();
    }

    // ===== READ =====
    @Transactional(readOnly = true)
    public Appointment getById(String id) {
        return findById(id);
    }

    @Transactional(readOnly = true)
    public PagedResponse<Appointment> getAll(String search, StatusOfAppointment status, Pageable pageable) {
        return PagedResponse.from(appointmentRepository.searchAppointments(search, status, pageable));
    }

    // ===== HELPERS =====
    private Appointment findById(String id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.APPOINTMENT_NOT_FOUND));
    }

    private Appointment transition(String appointmentId, StatusOfAppointment newStatus) {
        Appointment appointment = findById(appointmentId);
        validateTransition(appointment.getStatusOfAppointment(), newStatus);
        appointment.setStatusOfAppointment(newStatus);
        return appointmentRepository.save(appointment);
    }

    private void validateTransition(StatusOfAppointment current, StatusOfAppointment target) {
        Set<StatusOfAppointment> allowed = VALID_TRANSITIONS.getOrDefault(current, Set.of());
        if (!allowed.contains(target)) {
            throw new AppException(ErrorCode.INVALID_STATE_TRANSITION,
                    String.format("Không thể chuyển từ %s sang %s", current, target));
        }
    }

    private double calculateTotalDuration(List<AppointmentDetailRequest> details) {
        return details.stream().mapToDouble(d -> {
            Service service = serviceRepository.findById(d.getServiceId())
                    .orElseThrow(() -> new AppException(ErrorCode.SERVICE_NOT_FOUND));
            return service.getDuration();
        }).sum();
    }

    private List<AppoinmentDetail> buildDetails(Appointment appointment, List<AppointmentDetailRequest> detailRequests) {
        List<AppoinmentDetail> result = new ArrayList<>();
        LocalDateTime slotStart = appointment.getDateTime();

        for (AppointmentDetailRequest req : detailRequests) {
            Service service = serviceRepository.findById(req.getServiceId())
                    .orElseThrow(() -> new AppException(ErrorCode.SERVICE_NOT_FOUND));

            // Business Rule: Service must be ACTIVE
            if (service.getStatusOfService() != StatusOfService.ACTIVE) {
                throw new AppException(ErrorCode.SERVICE_INACTIVE,
                        "Dịch vụ '" + service.getName() + "' không còn hoạt động");
            }

            Employee employee = employeeRepository.findById(req.getEmployeeId())
                    .orElseThrow(() -> new AppException(ErrorCode.EMPLOYEE_NOT_FOUND));

            // Business Rule: Employee must be ACTIVE
            if (employee.getStatusOfEmployee() != StatusOfEmployee.ACTIVE) {
                throw new AppException(ErrorCode.EMPLOYEE_INACTIVE,
                        "Nhân viên '" + employee.getName() + "' không còn làm việc");
            }

            // Business Rule: Therapist cannot serve multiple appointments simultaneously
            LocalDateTime slotEnd = slotStart.plusMinutes((long) service.getDuration());
            List<Employee> available = employeeRepository.findAvailableEmployees(slotStart, slotEnd);
            boolean isAvailable = available.stream()
                    .anyMatch(e -> e.getEmployeeId().equals(employee.getEmployeeId()));
            if (!isAvailable) {
                throw new AppException(ErrorCode.APPOINTMENT_THERAPIST_CONFLICT,
                        "Nhân viên '" + employee.getName() + "' đã có lịch phục vụ trong khung giờ này");
            }

            AppoinmentDetail detail = new AppoinmentDetail();
            detail.setId(new AppoimentDetalId(appointment.getAppointmentId(), service.getServiceId(), employee.getEmployeeId()));
            detail.setAppointment(appointment);
            detail.setService(service);
            detail.setEmployee(employee);
            detail.setPrice(service.getPrice());
            result.add(detail);

            slotStart = slotEnd; // Sequential services
        }
        return result;
    }
}
