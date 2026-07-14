package fit.quanlyspa.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "appointment_reminder_logs", uniqueConstraints = @UniqueConstraint(
        name = "uk_appointment_reminder", columnNames = {"appointment_id", "lead_hours", "channel"}))
public class AppointmentReminderLog {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "reminder_log_id", updatable = false)
    private String reminderLogId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "appointment_id", nullable = false)
    private Appointment appointment;

    @Column(name = "lead_hours", nullable = false)
    private int leadHours;

    @Column(name = "channel", nullable = false, length = 20)
    private String channel;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "recipient", length = 30)
    private String recipient;

    @Column(name = "message", length = 1000)
    private String message;

    @Column(name = "error_message", length = 1000)
    private String errorMessage;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
