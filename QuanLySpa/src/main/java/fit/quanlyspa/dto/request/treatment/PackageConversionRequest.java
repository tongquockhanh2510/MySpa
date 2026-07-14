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
    // Gia tri quy doi do server tu tinh tu so buoi con lai; client khong can gui
    double conversionValue;
    String targetProductId;
    String targetPackageId;
    // So luong san pham nhan (chi dung cho TO_PRODUCT, mac dinh 1)
    Integer quantity;
    String note;
}
