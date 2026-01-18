package fit.quanlyspa.entity;

import fit.quanlyspa.enums.ConversionType;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
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
    String conversionId;
    ConversionType conversionType;
    double  conversionValue;
    LocalDate conversionDate;
    String note;
    @OneToOne(mappedBy = "packageConversion")
    CustomerTreatment  customerTreatment;
}
