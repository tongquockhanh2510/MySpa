package fit.quanlyspa.service;

import fit.quanlyspa.dto.response.treatment.TreatmentSessionResponse;
import fit.quanlyspa.entity.Employee;
import fit.quanlyspa.entity.TreatmentSchedule;
import fit.quanlyspa.entity.TreatmentSession;
import fit.quanlyspa.enums.TreatmentScheduleStatus;
import fit.quanlyspa.exception.AppException;
import fit.quanlyspa.exception.ErrorCode;
import fit.quanlyspa.repository.CustomerTreatmentRepository;
import fit.quanlyspa.repository.EmployeeRepository;
import fit.quanlyspa.repository.TreatmentScheduleRepository;
import fit.quanlyspa.repository.TreatmentSessionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TreatmentSessionServiceTest {

    @Mock TreatmentSessionRepository treatmentSessionRepository;
    @Mock TreatmentScheduleRepository treatmentScheduleRepository;
    @Mock CustomerTreatmentRepository customerTreatmentRepository;
    @Mock EmployeeRepository employeeRepository;

    @InjectMocks TreatmentSessionService treatmentSessionService;

    @Test
    void startSessionRejectsScheduleAlreadyInProgress() {
        TreatmentSchedule schedule = schedule(TreatmentScheduleStatus.IN_PROGRESS);
        when(treatmentScheduleRepository.findById("schedule-1")).thenReturn(Optional.of(schedule));

        AppException ex = assertThrows(AppException.class,
                () -> treatmentSessionService.startSession("schedule-1", null));

        assertEquals(ErrorCode.OPERATION_NOT_ALLOWED, ex.getErrorCode());
        verify(treatmentSessionRepository, never()).save(any(TreatmentSession.class));
        verify(treatmentScheduleRepository, never()).save(any(TreatmentSchedule.class));
    }

    @Test
    void startSessionRejectsExistingActiveSession() {
        TreatmentSchedule schedule = schedule(TreatmentScheduleStatus.SCHEDULED);
        when(treatmentScheduleRepository.findById("schedule-1")).thenReturn(Optional.of(schedule));
        when(treatmentSessionRepository.existsByTreatmentSchedule_ScheduleIdAndEndTimeIsNull("schedule-1"))
                .thenReturn(true);

        AppException ex = assertThrows(AppException.class,
                () -> treatmentSessionService.startSession("schedule-1", null));

        assertEquals(ErrorCode.OPERATION_NOT_ALLOWED, ex.getErrorCode());
        verify(treatmentSessionRepository, never()).save(any(TreatmentSession.class));
        verify(treatmentScheduleRepository, never()).save(any(TreatmentSchedule.class));
    }

    @Test
    void startSessionCreatesSessionWhenScheduleHasNoActiveSession() {
        TreatmentSchedule schedule = schedule(TreatmentScheduleStatus.SCHEDULED);
        when(treatmentScheduleRepository.findById("schedule-1")).thenReturn(Optional.of(schedule));
        when(treatmentSessionRepository.existsByTreatmentSchedule_ScheduleIdAndEndTimeIsNull("schedule-1"))
                .thenReturn(false);
        when(treatmentSessionRepository.save(any(TreatmentSession.class))).thenAnswer(invocation -> {
            TreatmentSession session = invocation.getArgument(0);
            session.setSessionId("session-1");
            return session;
        });
        when(treatmentScheduleRepository.save(any(TreatmentSchedule.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TreatmentSessionResponse response = treatmentSessionService.startSession("schedule-1", null);

        assertEquals("session-1", response.getSessionId());
        assertEquals("schedule-1", response.getScheduleId());
        assertEquals(TreatmentScheduleStatus.IN_PROGRESS, schedule.getStatus());
        verify(treatmentSessionRepository).save(any(TreatmentSession.class));
        verify(treatmentScheduleRepository).save(schedule);
    }

    private TreatmentSchedule schedule(TreatmentScheduleStatus status) {
        Employee therapist = new Employee();
        therapist.setEmployeeId("employee-1");
        therapist.setName("Therapist");

        TreatmentSchedule schedule = new TreatmentSchedule();
        schedule.setScheduleId("schedule-1");
        schedule.setSessionNumber(1);
        schedule.setStatus(status);
        schedule.setTherapist(therapist);
        return schedule;
    }
}
