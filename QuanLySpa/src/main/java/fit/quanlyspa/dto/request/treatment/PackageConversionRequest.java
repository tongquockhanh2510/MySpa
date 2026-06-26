package fit.quanlyspa.dto.request.treatment;

import fit.quanlyspa.enums.ConversionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PackageConversionRequest {
    @NotBlank
    String customerId;
    @NotBlank
    String packageId;
    @NotNull
    ConversionType conversionType;
    double conversionValue;
    String targetProductId;
    String targetPackageId;
    String note;
}
