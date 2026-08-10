package fit.quanlyspa.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.util.ArrayList;
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

    // ISS-006: đơn hàng bán gói này (để hồi tố hoa hồng phần chưa dùng khi quy đổi)
    @Column(name = "source_order_id")
    String sourceOrderId;

    LocalDate purchaseDate;
    LocalDate expiryDate;
    LocalDate cancelDate;
    String cancelReason;

    @Column(name = "package_conversion_id", insertable = false, updatable = false)
    String packageConversionId;

    @OneToOne
    @JoinColumn(name = "package_conversion_id")
    PackageConversion packageConversion;
}

