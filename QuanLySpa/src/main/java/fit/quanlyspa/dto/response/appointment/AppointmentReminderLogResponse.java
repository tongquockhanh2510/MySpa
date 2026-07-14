package fit.quanlyspa.dto.response.appointment;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;

@Value
@Builder
public class AppointmentReminderLogResponse {
    String reminderLogId;
    String appointmentId;
    String customerName;
    LocalDateTime appointmentTime;
    int leadHours;
    String channel;
    String status;
    String recipient;
    String message;
    String errorMessage;
    LocalDateTime sentAt;
    LocalDateTime createdAt;
}
