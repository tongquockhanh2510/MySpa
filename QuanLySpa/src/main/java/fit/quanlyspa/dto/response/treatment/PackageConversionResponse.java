package fit.quanlyspa.dto.response.treatment;

import fit.quanlyspa.enums.ConversionType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class PackageConversionResponse {
    String conversionId;
    ConversionType conversionType;
    double conversionValue;
    LocalDate conversionDate;
    String note;
    String customerId;
    String customerName;
    String packageId;
    String packageName;
    String targetProductId;
    String targetProductName;
    String targetPackageId;
    String targetPackageName;
    String voucherCode;
    int convertedSessions;
}
