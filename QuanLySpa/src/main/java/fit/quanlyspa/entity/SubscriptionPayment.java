package fit.quanlyspa.entity;

import fit.quanlyspa.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "subscription_payments", indexes = {
        @Index(name = "idx_subscription_payment_memo", columnList = "payment_memo", unique = true)
})
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SubscriptionPayment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "payment_id", updatable = false)
    String paymentId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "subscription_id", nullable = false)
    SpaSubscription subscription;

    @Column(nullable = false, precision = 15, scale = 2)
    BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    PaymentStatus status = PaymentStatus.PENDING;

    @Column(name = "payment_memo", nullable = false, unique = true, length = 30)
    String paymentMemo;

    @Column(name = "transaction_reference", length = 200)
    String transactionReference;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;

    @Column(name = "paid_at")
    LocalDateTime paidAt;
}
