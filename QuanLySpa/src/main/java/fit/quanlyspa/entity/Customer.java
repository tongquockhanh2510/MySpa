package fit.quanlyspa.entity;

import fit.quanlyspa.enums.Gender;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Set;

@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "customers")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Customer {
    @Id
            @Column(name = "customer_id")
    String customerId;
    String name;
    String phone;
    String email;
    Gender gender;
    String note;
    @Column(name = "loyalty_points")
    double loyaltyPoints;
    @OneToMany(mappedBy = "customer")
    Set<Appointment> appointments;
    @OneToMany(mappedBy = "customer")
    Set<Order> orders;
    @OneToMany(mappedBy = "customer")
    Set<CustomerTreatment>  customerTreatments;

}
