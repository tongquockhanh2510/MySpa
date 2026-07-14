package fit.quanlyspa.dto.response.notification;

import fit.quanlyspa.enums.NotificationType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class NotificationResponse {
    String notificationId;
    NotificationType notificationType;
    String title;
    String message;
    String referenceId;
    String referenceType;
    boolean isRead;
    LocalDateTime readAt;
    LocalDateTime createdAt;
    String customerName;
    String employeeName;
}
