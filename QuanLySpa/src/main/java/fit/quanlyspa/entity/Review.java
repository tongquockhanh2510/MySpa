package fit.quanlyspa.entity;

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
@Table(name = "reviews")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "review_id", updatable = false)
    String reviewId;

    @Column(name = "rating", nullable = false)
    int rating; // 1-5 stars

    @Column(name = "service_rating")
    Integer serviceRating;

    @Column(name = "staff_rating")
    Integer staffRating;

    @Column(name = "facility_rating")
    Integer facilityRating;

    @Column(name = "comment", columnDefinition = "TEXT")
    String comment;

    @Column(name = "is_anonymous")
    @Builder.Default
    boolean isAnonymous = false;

    @Column(name = "is_approved")
    @Builder.Default
    boolean isApproved = false;

    @Column(name = "manager_reply", columnDefinition = "TEXT")
    String managerReply;

    @Column(name = "replied_at")
    LocalDateTime repliedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;

    // ===== Relationships =====

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    Customer customer;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", nullable = false, unique = true)
    Appointment appointment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id")
    Employee employee;
}
