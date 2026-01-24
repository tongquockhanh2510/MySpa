package fit.quanlyspa.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "products")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Product {
    @Id
    @Column(name = "product_id")
    String productId;
    String name;
    double price;
    String brand;
    @Column(name = "stock_quantity")
    double stockQuantity;
    String description;

    String image;
    @ManyToOne
    @JoinColumn(name = "category_id")
    Category category;
    @OneToOne(mappedBy = "product")
    OrderItem orderItem;
    @ManyToOne
    @JoinColumn(name = "employee_id")
    Employee employee;
}
