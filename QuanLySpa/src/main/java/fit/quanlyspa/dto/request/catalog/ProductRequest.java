package fit.quanlyspa.dto.request.catalog;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class ProductRequest {
    @NotBlank
    String name;
    String sku;
    @Positive
    double price;
    @Min(0)
    double costPrice;
    @NotBlank
    String brand;
    @Min(0)
    double stockQuantity;
    @Min(0)
    double minStockLevel;
    String unit;
    String barcode;
    @NotBlank
    String description;
    String image;
    String categoryId;
}
