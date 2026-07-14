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

    @Column(name = "target_product_id")
    String targetProductId;

    @Column(name = "target_package_id")
    String targetPackageId;

    @Column(name = "voucher_code")
    String voucherCode;

    @Column(name = "converted_sessions")
    Integer convertedSessions;

    // Don hang chuyen doi duoc sinh ra (mua san pham/goi moi bang gia tri quy doi)
    @Column(name = "order_id")
    String orderId;

    // So tien khach can bu them (tong don hang sau khi tru gia tri quy doi)
    @Column(name = "top_up_amount")
    Double topUpAmount;

    // Voucher hoan lai phan gia tri du (neu gia tri quy doi > gia tri don moi)
    @Column(name = "leftover_voucher_code")
    String leftoverVoucherCode;

    @OneToOne(mappedBy = "packageConversion")
    CustomerTreatment  customerTreatment;
}
