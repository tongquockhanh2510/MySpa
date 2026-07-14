package fit.quanlyspa.service;

import fit.quanlyspa.dto.response.notification.NotificationResponse;
import fit.quanlyspa.entity.Customer;
import fit.quanlyspa.entity.Notification;
import fit.quanlyspa.enums.NotificationType;
import fit.quanlyspa.exception.AppException;
import fit.quanlyspa.exception.ErrorCode;
import fit.quanlyspa.repository.NotificationRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class NotificationService {

    NotificationRepository notificationRepository;

    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotifications(boolean unreadOnly, int size) {
        PageRequest page = PageRequest.of(0, Math.min(Math.max(size, 1), 200));
        var notifications = unreadOnly
                ? notificationRepository.findByIsReadFalseOrderByCreatedAtDesc(page)
                : notificationRepository.findAllByOrderByCreatedAtDesc(page);
        return notifications.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public long getUnreadCount() {
        return notificationRepository.countByIsReadFalse();
    }

    @Transactional
    public NotificationResponse markRead(String notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new AppException(ErrorCode.VALIDATION_ERROR, "Không tìm thấy thông báo"));
        if (!notification.isRead()) {
            notification.setRead(true);
            notification.setReadAt(LocalDateTime.now());
            notificationRepository.save(notification);
        }
        return toResponse(notification);
    }

    @Transactional
    public int markAllRead() {
        return notificationRepository.markAllRead(LocalDateTime.now());
    }

    /**
     * Tao thong bao noi bo. Chay o transaction rieng de loi ghi thong bao
     * khong lam hong nghiep vu chinh (thanh toan, dat lich...).
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void notify(NotificationType type, String title, String message, String referenceId, String referenceType, Customer customer) {
        try {
            Notification notification = Notification.builder()
                    .notificationType(type)
                    .title(title)
                    .message(message)
                    .referenceId(referenceId)
                    .referenceType(referenceType)
                    .customer(customer)
                    .isSent(true)
                    .sentAt(LocalDateTime.now())
                    .build();
            notificationRepository.save(notification);
        } catch (Exception e) {
            log.warn("Khong the tao thong bao [{}] {}: {}", type, title, e.getMessage());
        }
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .notificationId(n.getNotificationId())
                .notificationType(n.getNotificationType())
                .title(n.getTitle())
                .message(n.getMessage())
                .referenceId(n.getReferenceId())
                .referenceType(n.getReferenceType())
                .isRead(n.isRead())
                .readAt(n.getReadAt())
                .createdAt(n.getCreatedAt())
                .customerName(n.getCustomer() != null ? n.getCustomer().getName() : null)
                .employeeName(n.getEmployee() != null ? n.getEmployee().getName() : null)
                .build();
    }
}
