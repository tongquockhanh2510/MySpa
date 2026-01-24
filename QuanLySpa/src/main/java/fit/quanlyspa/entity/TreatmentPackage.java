package fit.quanlyspa.entity;

import fit.quanlyspa.enums.StatusOfPakage;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;


@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "treatment_packages")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TreatmentPackage {
    @Id
    @Column(name = "treatment_package_id")
    String treatmentPackageId;
    @Column(name = "package_name")
    String packageName;
    @Column(name = "total_sessions")
    int totalSessions;
    @Column(name = "package_price")
    double packagePrice;
    @Column(name = "description")
    String description;

    @Column(name = "status_of_package")
    StatusOfPakage statusOfPakage;
    @ManyToOne
    @JoinColumn(name = "employee_id")
    Employee employee;
    @OneToOne(mappedBy = "treatmentPackage")
    OrderItem orderItem;
    @OneToMany(mappedBy = "treatmentPackage")
    List<CustomerTreatment> customerTreatments;
}
