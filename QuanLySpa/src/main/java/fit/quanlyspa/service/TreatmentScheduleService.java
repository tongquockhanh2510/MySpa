package fit.quanlyspa.service;

import fit.quanlyspa.dto.response.treatment.TreatmentScheduleResponse;
import fit.quanlyspa.entity.Employee;
import fit.quanlyspa.entity.Room;
import fit.quanlyspa.entity.TreatmentSchedule;
import fit.quanlyspa.enums.TreatmentScheduleStatus;
import fit.quanlyspa.exception.AppException;
import fit.quanlyspa.exception.ErrorCode;
import fit.quanlyspa.repository.EmployeeRepository;
import fit.quanlyspa.repository.RoomRepository;
import fit.quanlyspa.repository.TreatmentScheduleRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TreatmentScheduleService {

    TreatmentScheduleRepository treatmentScheduleRepository;
    EmployeeRepository employeeRepository;
    RoomRepository roomRepository;

    @Transactional(readOnly = true)
    public List<TreatmentScheduleResponse> getSchedulesByCustomerId(String customerId) {
        return treatmentScheduleRepository.findByCustomerId(customerId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public TreatmentScheduleResponse reschedule(String scheduleId, LocalDate newDate, String therapistId, String roomId) {
        TreatmentSchedule schedule = treatmentScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new AppException(ErrorCode.APPOINTMENT_NOT_FOUND, "Không tìm thấy lịch trình điều trị"));

        if (schedule.getStatus() == TreatmentScheduleStatus.COMPLETED) {
            throw new AppException(ErrorCode.OPERATION_NOT_ALLOWED, "Không thể xếp lại lịch cho buổi trị liệu đã hoàn thành");
        }

        if (therapistId != null && !therapistId.isBlank()) {
            Employee therapist = employeeRepository.findById(therapistId)
                    .orElseThrow(() -> new AppException(ErrorCode.EMPLOYEE_NOT_FOUND));
            schedule.setTherapist(therapist);
        }

        if (roomId != null && !roomId.isBlank()) {
            Room room = roomRepository.findById(roomId)
                    .orElseThrow(() -> new AppException(ErrorCode.VALIDATION_ERROR, "Không tìm thấy phòng"));
            schedule.setRoom(room);
        }

        schedule.setScheduledDate(newDate);
        schedule.setStatus(TreatmentScheduleStatus.RESCHEDULED);

        TreatmentSchedule saved = treatmentScheduleRepository.save(schedule);
        log.info("Rescheduled treatment session {} to {}", scheduleId, newDate);

        return toResponse(saved);
    }

    public TreatmentScheduleResponse toResponse(TreatmentSchedule ts) {
        return TreatmentScheduleResponse.builder()
                .scheduleId(ts.getScheduleId())
                .customerId(ts.getCustomerTreatment().getCustomer().getCustomerId())
                .customerName(ts.getCustomerTreatment().getCustomer().getName())
                .customerPhone(ts.getCustomerTreatment().getCustomer().getPhone())
                .packageId(ts.getCustomerTreatment().getTreatmentPackage().getTreatmentPackageId())
                .packageName(ts.getCustomerTreatment().getTreatmentPackage().getPackageName())
                .sessionNumber(ts.getSessionNumber())
                .scheduledDate(ts.getScheduledDate())
                .therapistId(ts.getTherapist() != null ? ts.getTherapist().getEmployeeId() : null)
                .therapistName(ts.getTherapist() != null ? ts.getTherapist().getName() : null)
                .roomId(ts.getRoom() != null ? ts.getRoom().getRoomId() : null)
                .roomName(ts.getRoom() != null ? ts.getRoom().getRoomName() : null)
                .status(ts.getStatus())
                .build();
    }
}
