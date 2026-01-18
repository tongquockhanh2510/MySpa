package fit.quanlyspa.entity;

import fit.quanlyspa.enums.StatusOfService;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "services")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Service {
    @Id
    @Column(name = "service_id")
    String serviceId;
    String name;
    double price;
    double duration;
    String description;
    @Column(name = "status_of_service")
    StatusOfService  statusOfService;
    @Column(name = "commission_rate")
    double commissionRate;
}
