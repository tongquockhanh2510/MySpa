package fit.quanlyspa.entity;

import fit.quanlyspa.enums.ConversionType;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "package_conversions")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PackageConversion {
    @Id
            @Column(name = "conversion_id")
    String conversionId;
    @Column(name = "conversion_type")
    @Enumerated(EnumType.STRING)
    ConversionType conversionType;

    @Column(name = "conversion_value")
    double  conversionValue;
    @Column(name = "conversion_date")
    LocalDate conversionDate;
    String note;
    @OneToOne(mappedBy = "packageConversion")
    CustomerTreatment  customerTreatment;
}
