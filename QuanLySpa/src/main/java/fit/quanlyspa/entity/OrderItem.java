package fit.quanlyspa.entity;

import fit.quanlyspa.enums.OrderItemType;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.Set;

@Getter
@Setter
@Entity
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "order_items")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_item_id")
    Long orderItemId;

    @Enumerated(EnumType.STRING)
    @Column(name = "item_type", nullable = false)
    OrderItemType itemType;

    @Column(name = "quantity", nullable = false)
    int quantity;

    @Column(name = "unit_price", nullable = false, precision = 15, scale = 2)
    BigDecimal unitPrice;

    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    BigDecimal amount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id")
    Service service;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "package_id")
    TreatmentPackage treatmentPackage;

    @OneToMany(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_item_id")
    Set<Promotion> promotions;
}
