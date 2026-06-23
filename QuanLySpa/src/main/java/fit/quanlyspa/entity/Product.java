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
@Table(name = "products", indexes = {
        @Index(name = "idx_product_sku", columnList = "sku"),
        @Index(name = "idx_product_category", columnList = "category_id")
})
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "product_id", updatable = false)
    String productId;

    @Column(name = "name", nullable = false, length = 200)
    String name;

    @Column(name = "sku", unique = true, length = 50)
    String sku;

    @Column(name = "price", nullable = false)
    double price;

    @Column(name = "cost_price")
    double costPrice;

    @Column(name = "brand", length = 100)
    String brand;

    @Column(name = "stock_quantity")
    @Builder.Default
    double stockQuantity = 0;

    @Column(name = "min_stock_level")
    @Builder.Default
    double minStockLevel = 5;

    @Column(name = "unit", length = 30)
    String unit;

    @Column(name = "barcode", length = 50)
    String barcode;

    @Column(name = "description", columnDefinition = "TEXT")
    String description;

    @Column(name = "image")
    String image;

    @Column(name = "is_active")
    @Builder.Default
    boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    LocalDateTime updatedAt;

    // ===== Relationships =====

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    Category category;

    @OneToOne(mappedBy = "product", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    Inventory inventory;
}
