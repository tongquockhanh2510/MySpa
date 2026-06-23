package fit.quanlyspa.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "vouchers")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Voucher {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "voucher_id", updatable = false)
    String voucherId;

    @Column(name = "code", unique = true, nullable = false, length = 50)
    String code;

    @Column(name = "voucher_type", length = 20)
    String voucherType; // PERCENT, AMOUNT

    @Column(name = "discount_value", precision = 15, scale = 2)
    BigDecimal discountValue;

    @Column(name = "max_discount", precision = 15, scale = 2)
    BigDecimal maxDiscount;

    @Column(name = "min_order_value", precision = 15, scale = 2)
    @Builder.Default
    BigDecimal minOrderValue = BigDecimal.ZERO;

    @Column(name = "expiry_date")
    LocalDateTime expiryDate;

    @Column(name = "is_used")
    @Builder.Default
    boolean isUsed = false;

    @Column(name = "used_at")
    LocalDateTime usedAt;

    @Column(name = "note", length = 300)
    String note;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;

    // ===== Relationships =====

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    Customer customer; // null = any customer can use

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "promotion_id")
    Promotion promotion;
}
