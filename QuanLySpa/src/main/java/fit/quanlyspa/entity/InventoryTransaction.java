package fit.quanlyspa.entity;

import fit.quanlyspa.enums.InventoryTransactionType;
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
@Table(name = "inventory_transactions", indexes = {
        @Index(name = "idx_inv_txn_product", columnList = "product_id"),
        @Index(name = "idx_inv_txn_created", columnList = "created_at")
})
@FieldDefaults(level = AccessLevel.PRIVATE)
public class InventoryTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "transaction_id", updatable = false)
    String transactionId;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false)
    InventoryTransactionType transactionType;

    @Column(name = "quantity", nullable = false)
    double quantity;

    @Column(name = "quantity_before")
    double quantityBefore;

    @Column(name = "quantity_after")
    double quantityAfter;

    @Column(name = "unit_cost")
    double unitCost;

    @Column(name = "reference_id", length = 100)
    String referenceId; // invoice_id, purchase_order_id, etc.

    @Column(name = "note", length = 500)
    String note;

    @Column(name = "created_by", length = 100)
    String createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;

    // ===== Relationships =====

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    Product product;
}
