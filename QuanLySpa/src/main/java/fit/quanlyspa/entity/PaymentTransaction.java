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
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "payment_transactions")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PaymentTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "transaction_id", updatable = false)
    String transactionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    Order order;

    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false)
    PaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    PaymentStatus status;

    @Column(name = "transaction_reference", length = 200)
    String transactionReference;

    @Column(name = "notes", length = 300)
    String notes;

    @CreationTimestamp
    @Column(name = "processed_at", updatable = false)
    LocalDateTime processedAt;
}
