package fit.quanlyspa.entity;

import fit.quanlyspa.enums.OrderStatus;
import fit.quanlyspa.enums.TypeOfOrder;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Set;

@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "orders")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Order {
    @Id
    String orderId;
    double totalAmount;
    OrderStatus orderStatus;
    TypeOfOrder typeOfOrder;
    double paidAmount;
    double remainingAmount;
    @ManyToOne
    @JoinColumn(name = "customer_id")
    Customer customer;
    @OneToMany(mappedBy ="order")
    Set<OrderItem> orderItems;

}
