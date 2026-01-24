package fit.quanlyspa.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "customer_treatments")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CustomerTreatment {

    @EmbeddedId
    CustomerTreatmentId id;

    // ===== Customer =====
    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("customerId")
    @JoinColumn(name = "customer_id")
    Customer customer;

    // ===== Treatment Package =====
    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("packageId")
    @JoinColumn(name = "package_id")
    TreatmentPackage treatmentPackage;

    // ===== Appointments (N buổi) =====
    @OneToMany(mappedBy = "customerTreatment")
    List<AppoinmentDetail> appoinmentDetails = new ArrayList<>();

    int remainingSessions;

    LocalDate purchaseDate;
    LocalDate expiryDate;
    LocalDate cancelDate;
    String cancelReason;

    @OneToOne
    @JoinColumn(name = "package_conversion_id")
    PackageConversion packageConversion;
}

