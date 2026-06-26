package fit.quanlyspa.dto.response.catalog;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ProductResponse {
    String productId;
    String name;
    String sku;
    double price;
    double costPrice;
    String brand;
    double stockQuantity;
    double minStockLevel;
    String unit;
    String barcode;
    String description;
    String image;
    boolean active;
    String categoryId;
    String categoryName;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
