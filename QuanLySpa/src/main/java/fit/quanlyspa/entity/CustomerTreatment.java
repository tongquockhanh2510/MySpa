package fit.quanlyspa.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.util.Date;

@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "customer_treatments")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CustomerTreatment {
    @EmbeddedId
            @Column(name = "customer_treatment_id")
    CustomerTreatmentId customerTreatmentId;
    @Column(name = "remaining_sessions")
    int remainingSessions;
    @Column(name = "purchase_date")
    LocalDate purchaseDate;
    @Column(name = "expiry_date")
    LocalDate expiryDate;
    @Column(name = "cancel_date")
    LocalDate cancelDate;
    @Column(name = "cancel_reason")
    String cancelReason;
    @OneToOne
    @JoinColumn(name = "package_conversion_id")
    PackageConversion packageConversion;
}
