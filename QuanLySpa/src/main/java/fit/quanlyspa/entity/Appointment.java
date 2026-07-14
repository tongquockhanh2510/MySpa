package fit.quanlyspa.entity;

import fit.quanlyspa.enums.StatusOfAppointment;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "appointments", indexes = {
        @Index(name = "idx_appointment_customer", columnList = "customer_id"),
        @Index(name = "idx_appointment_datetime", columnList = "date_time"),
        @Index(name = "idx_appointment_status", columnList = "status_of_appointment")
})
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "appointment_id", updatable = false)
    String appointmentId;

    @Column(name = "display_code", unique = true, length = 30)
    String displayCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_of_appointment", nullable = false)
    @Builder.Default
    StatusOfAppointment statusOfAppointment = StatusOfAppointment.PENDING;

    @Column(name = "date_time", nullable = false)
    LocalDateTime dateTime;

    @Column(name = "end_time")
    LocalDateTime endTime;

    @Column(name = "checked_in_at")
    LocalDateTime checkedInAt;

    @Column(name = "completed_at")
    LocalDateTime completedAt;

    @Column(name = "note", columnDefinition = "TEXT")
    String note;

    @Column(name = "cancel_reason", length = 500)
    String cancelReason;

    @Column(name = "cancelled_at")
    LocalDateTime cancelledAt;

    @Column(name = "rescheduled_to")
    LocalDateTime rescheduledTo;

    @Column(name = "created_by", length = 100)
    String createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    LocalDateTime updatedAt;

    // ===== Relationships =====

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    Room room;

    @OneToMany(mappedBy = "appointment", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    List<AppoinmentDetail> details = new ArrayList<>();

    @OneToOne(mappedBy = "appointment", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    Review review;

    @OneToOne(mappedBy = "appointment", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    Invoice invoice;

}
