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
@Table(name = "loyalty_points", indexes = {
        @Index(name = "idx_loyalty_customer", columnList = "customer_id")
})
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LoyaltyPoint {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "loyalty_id", updatable = false)
    String loyaltyId;

    @Column(name = "transaction_type", length = 20)
    String transactionType; // EARN, REDEEM, EXPIRE, ADJUST

    @Column(name = "points")
    double points;

    @Column(name = "balance_after")
    double balanceAfter;

    @Column(name = "description", length = 300)
    String description;

    @Column(name = "reference_id", length = 100)
    String referenceId; // invoice_id, appointment_id, etc.

    @Column(name = "reference_type", length = 50)
    String referenceType;

    @Column(name = "expired_at")
    LocalDateTime expiredAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;

    // ===== Relationships =====

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    Customer customer;
}
