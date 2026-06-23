package fit.quanlyspa.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "invoice_details")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class InvoiceDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "invoice_detail_id")
    Long invoiceDetailId;

    @Column(name = "item_name", nullable = false, length = 200)
    String itemName;

    @Column(name = "item_type", length = 50)
    String itemType; // SERVICE, PRODUCT, PACKAGE

    @Column(name = "quantity")
    @Builder.Default
    int quantity = 1;

    @Column(name = "unit_price", nullable = false, precision = 15, scale = 2)
    BigDecimal unitPrice;

    @Column(name = "discount_amount", precision = 15, scale = 2)
    @Builder.Default
    BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    BigDecimal amount;

    @Column(name = "note", length = 300)
    String note;

    // ===== Relationships =====

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    Invoice invoice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id")
    Service service;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "package_id")
    TreatmentPackage treatmentPackage;
}
