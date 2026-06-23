package fit.quanlyspa.entity;

import fit.quanlyspa.enums.OrderStatus;
import fit.quanlyspa.enums.TypeOfOrder;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@Entity
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "orders")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "order_id", updatable = false)
    String orderId;

    @Enumerated(EnumType.STRING)
    @Column(name = "order_status", nullable = false)
    OrderStatus orderStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_of_order")
    TypeOfOrder typeOfOrder;

    @Column(name = "subtotal", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    BigDecimal subtotal = BigDecimal.ZERO;

    @Column(name = "promo_discount", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    BigDecimal promoDiscount = BigDecimal.ZERO;

    @Column(name = "voucher_discount", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    BigDecimal voucherDiscount = BigDecimal.ZERO;

    @Column(name = "membership_discount", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    BigDecimal membershipDiscount = BigDecimal.ZERO;

    @Column(name = "tax_amount", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "total_amount", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "paid_amount", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    BigDecimal paidAmount = BigDecimal.ZERO;

    @Column(name = "remaining_amount", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    BigDecimal remainingAmount = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    Customer customer;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    Set<OrderItem> orderItems = new HashSet<>();

    @Column(name = "created_by")
    String createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    LocalDateTime updatedAt;
}
