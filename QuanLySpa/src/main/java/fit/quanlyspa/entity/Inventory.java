package fit.quanlyspa.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "inventory")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Inventory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "inventory_id", updatable = false)
    String inventoryId;

    @Column(name = "quantity_in_stock", nullable = false)
    @Builder.Default
    double quantityInStock = 0;

    @Column(name = "unit", length = 30)
    String unit; // ml, g, piece, bottle, etc.

    @Column(name = "min_stock_level")
    @Builder.Default
    double minStockLevel = 5;

    @Column(name = "max_stock_level")
    @Builder.Default
    double maxStockLevel = 100;

    @Column(name = "last_restocked_at")
    LocalDateTime lastRestockedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    LocalDateTime updatedAt;

    // ===== Relationships =====

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false, unique = true)
    Product product;
}
