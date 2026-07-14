package fit.quanlyspa.entity;

import fit.quanlyspa.enums.InvoiceStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

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
@Table(name = "invoices", indexes = {
        @Index(name = "idx_invoice_customer", columnList = "customer_id"),
        @Index(name = "idx_invoice_status", columnList = "status"),
        @Index(name = "idx_invoice_created", columnList = "created_at")
})
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "invoice_id", updatable = false)
    String invoiceId;

    @Column(name = "invoice_number", unique = true, length = 50)
    String invoiceNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    InvoiceStatus status = InvoiceStatus.DRAFT;

    @Column(name = "subtotal", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    BigDecimal subtotal = BigDecimal.ZERO;

    @Column(name = "discount_amount", precision = 15, scale = 2)
    @Builder.Default
    BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "tax_amount", precision = 15, scale = 2)
    @Builder.Default
    BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "total_amount", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "paid_amount", precision = 15, scale = 2)
    @Builder.Default
    BigDecimal paidAmount = BigDecimal.ZERO;

    @Column(name = "remaining_amount", precision = 15, scale = 2)
    @Builder.Default
    BigDecimal remainingAmount = BigDecimal.ZERO;

    @Column(name = "loyalty_points_used")
    @Builder.Default
    double loyaltyPointsUsed = 0;

    @Column(name = "loyalty_points_earned")
    @Builder.Default
    double loyaltyPointsEarned = 0;

    @Column(name = "note", columnDefinition = "TEXT")
    String note;

    @Column(name = "created_by", length = 100)
    String createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    LocalDateTime updatedAt;

    @Column(name = "paid_at")
    LocalDateTime paidAt;

    // ===== Relationships =====

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    Customer customer;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id")
    Appointment appointment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "promotion_id")
    Promotion promotion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "voucher_id")
    Voucher voucher;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    List<InvoiceDetail> details = new ArrayList<>();

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    List<Payment> payments = new ArrayList<>();

}
