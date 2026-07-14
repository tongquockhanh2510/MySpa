package fit.quanlyspa.controller;

import fit.quanlyspa.dto.response.ApiResponse;
import fit.quanlyspa.dto.response.appointment.AppointmentReminderLogResponse;
import fit.quanlyspa.service.AppointmentReminderService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/appointment-reminders")
@RequiredArgsConstructor
public class AppointmentReminderController {
    private final AppointmentReminderService reminderService;

    @GetMapping("/logs")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ApiResponse<List<AppointmentReminderLogResponse>> getLogs() {
        return ApiResponse.<List<AppointmentReminderLogResponse>>builder()
                .result(reminderService.getLogs())
                .build();
    }

    @PostMapping("/run")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ApiResponse<Integer> runNow() {
        return ApiResponse.<Integer>builder()
                .message("Da quet lich can nhac")
                .result(reminderService.runDueReminders())
                .build();
    }
}
