package fit.quanlyspa.service;

import fit.quanlyspa.dto.request.treatment.TreatmentSessionCreateRequest;
import fit.quanlyspa.dto.response.treatment.TreatmentSessionResponse;
import fit.quanlyspa.entity.*;
import fit.quanlyspa.enums.TreatmentScheduleStatus;
import fit.quanlyspa.exception.AppException;
import fit.quanlyspa.exception.ErrorCode;
import fit.quanlyspa.repository.CustomerTreatmentRepository;
import fit.quanlyspa.repository.EmployeeRepository;
import fit.quanlyspa.repository.TreatmentScheduleRepository;
import fit.quanlyspa.repository.TreatmentSessionRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TreatmentSessionService {

    TreatmentSessionRepository treatmentSessionRepository;
    TreatmentScheduleRepository treatmentScheduleRepository;
    CustomerTreatmentRepository customerTreatmentRepository;
    EmployeeRepository employeeRepository;

    @Transactional
    public TreatmentSessionResponse startSession(String scheduleId, String therapistId) {
        TreatmentSchedule schedule = treatmentScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new AppException(ErrorCode.APPOINTMENT_NOT_FOUND, "Không tìm thấy lịch trình trị liệu"));

        if (schedule.getStatus() == TreatmentScheduleStatus.COMPLETED) {
            throw new AppException(ErrorCode.OPERATION_NOT_ALLOWED, "Buổi trị liệu này đã được thực hiện và hoàn thành");
        }

        if (schedule.getStatus() == TreatmentScheduleStatus.IN_PROGRESS
                || treatmentSessionRepository.existsByTreatmentSchedule_ScheduleIdAndEndTimeIsNull(scheduleId)) {
            throw new AppException(ErrorCode.OPERATION_NOT_ALLOWED, "Buổi trị liệu này đang được thực hiện");
        }

        Employee therapist = null;
        if (therapistId != null && !therapistId.isBlank()) {
            therapist = employeeRepository.findById(therapistId).orElse(null);
        }
        if (therapist == null) {
            therapist = schedule.getTherapist();
        }
        if (therapist == null) {
            throw new AppException(ErrorCode.EMPLOYEE_NOT_FOUND, "Cần phân công kỹ thuật viên cho buổi trị liệu này");
        }

        TreatmentSession session = TreatmentSession.builder()
                .treatmentSchedule(schedule)
                .sessionNumber(schedule.getSessionNumber())
                .startTime(LocalDateTime.now())
                .therapist(therapist)
                .build();

        session = treatmentSessionRepository.save(session);
        schedule.setStatus(TreatmentScheduleStatus.IN_PROGRESS);
        treatmentScheduleRepository.save(schedule);
        log.info("Started treatment session {} for schedule {}", session.getSessionId(), scheduleId);

        return toResponse(session);
    }

    @Transactional
    public TreatmentSessionResponse completeSession(String sessionId, String notes, String beforeImages, String afterImages, String result) {
        TreatmentSession session = treatmentSessionRepository.findById(sessionId)
                .orElseThrow(() -> new AppException(ErrorCode.APPOINTMENT_NOT_FOUND, "Không tìm thấy phiên trị liệu"));

        if (session.getEndTime() != null) {
            throw new AppException(ErrorCode.OPERATION_NOT_ALLOWED, "Phiên trị liệu này đã hoàn thành trước đó");
        }

        session.setEndTime(LocalDateTime.now());
        session.setNotes(notes);
        session.setBeforeImages(beforeImages);
        session.setAfterImages(afterImages);
        session.setResult(result);

        session = treatmentSessionRepository.save(session);

        // Update schedule status
        TreatmentSchedule schedule = session.getTreatmentSchedule();
        schedule.setStatus(TreatmentScheduleStatus.COMPLETED);
        treatmentScheduleRepository.save(schedule);

        // Decrement remaining sessions on the Customer Package
        CustomerTreatment pkg = schedule.getCustomerTreatment();
        if (pkg.getRemainingSessions() > 0) {
            pkg.setRemainingSessions(pkg.getRemainingSessions() - 1);
            customerTreatmentRepository.save(pkg);
            log.info("Decremented customer package remaining sessions. Customer: {}, Package: {}, Remaining: {}",
                    pkg.getCustomer().getName(), pkg.getTreatmentPackage().getPackageName(), pkg.getRemainingSessions());
        }

        return toResponse(session);
    }

    @Transactional(readOnly = true)
    public List<TreatmentSessionResponse> getSessionsByScheduleId(String scheduleId) {
        return treatmentSessionRepository.findByScheduleId(scheduleId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public TreatmentSessionResponse toResponse(TreatmentSession ts) {
        return TreatmentSessionResponse.builder()
                .sessionId(ts.getSessionId())
                .scheduleId(ts.getTreatmentSchedule().getScheduleId())
                .sessionNumber(ts.getSessionNumber())
                .startTime(ts.getStartTime())
                .endTime(ts.getEndTime())
                .therapistId(ts.getTherapist().getEmployeeId())
                .therapistName(ts.getTherapist().getName())
                .notes(ts.getNotes())
                .beforeImages(ts.getBeforeImages())
                .afterImages(ts.getAfterImages())
                .result(ts.getResult())
                .createdAt(ts.getCreatedAt())
                .build();
    }
}
