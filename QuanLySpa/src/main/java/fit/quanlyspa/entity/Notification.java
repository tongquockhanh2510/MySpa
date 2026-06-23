package fit.quanlyspa.entity;

import fit.quanlyspa.enums.NotificationType;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "notifications")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "notification_id", updatable = false)
    String notificationId;

    @Enumerated(EnumType.STRING)
    @Column(name = "notification_type", nullable = false)
    NotificationType notificationType;

    @Column(name = "title", nullable = false, length = 200)
    String title;

    @Column(name = "message", columnDefinition = "TEXT")
    String message;

    @Column(name = "reference_id", length = 100)
    String referenceId; // appointment_id, invoice_id, etc.

    @Column(name = "reference_type", length = 50)
    String referenceType;

    @Column(name = "is_read")
    @Builder.Default
    boolean isRead = false;

    @Column(name = "read_at")
    LocalDateTime readAt;

    @Column(name = "is_sent")
    @Builder.Default
    boolean isSent = false;

    @Column(name = "sent_at")
    LocalDateTime sentAt;

    @Column(name = "recipient_email", length = 150)
    String recipientEmail;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;

    // ===== Relationships =====

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id")
    Employee employee;
}
