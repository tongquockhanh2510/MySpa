package fit.quanlyspa.entity;

import fit.quanlyspa.enums.PaymentMethod;
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
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "payments")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "payment_id", updatable = false)
    String paymentId;

    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false)
    PaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    PaymentStatus status = PaymentStatus.PENDING;

    @Column(name = "transaction_reference", length = 200)
    String transactionReference;

    @Column(name = "note", length = 300)
    String note;

    @Column(name = "change_amount", precision = 15, scale = 2)
    @Builder.Default
    BigDecimal changeAmount = BigDecimal.ZERO;

    @Column(name = "is_refund")
    @Builder.Default
    boolean isRefund = false;

    @Column(name = "refund_reason", length = 500)
    String refundReason;

    @Column(name = "approved_by", length = 100)
    String approvedBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;

    @Column(name = "processed_at")
    LocalDateTime processedAt;

    // ===== Relationships =====

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id")
    Invoice invoice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    Order order;
}
