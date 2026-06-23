package fit.quanlyspa.dto.response.dashboard;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data @AllArgsConstructor @NoArgsConstructor @Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LowStockResponse {
    String productId;
    String productName;
    String brand;
    double currentStock;
    double minStockLevel;
    String unit;
}
