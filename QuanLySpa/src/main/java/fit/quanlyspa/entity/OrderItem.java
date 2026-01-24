package fit.quanlyspa.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Set;

@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "order_items")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_item_id")
    Long orderItemId;
    int quantity;
    @Column(name = "unit_price")
    double unitPrice;
    double amount;
    @ManyToOne
    @JoinColumn(name = "order_id")
    Order order;
    @OneToOne
    @JoinColumn(name = "product_id")
    Product product;
    @OneToOne
    @JoinColumn(name = "service_id")
    Service service;
    @OneToOne
    @JoinColumn(name = "package_id")
    TreatmentPackage treatmentPackage;
    @OneToMany
    @JoinColumn(name = "order_item_id")
    Set<Promotion> promotion;

}
