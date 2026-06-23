package fit.quanlyspa.dto.request.order;

import fit.quanlyspa.enums.OrderItemType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderItemRequest {

    @NotNull(message = "Loại sản phẩm/dịch vụ không được để trống")
    OrderItemType itemType;

    String productId;
    String serviceId;
    String packageId;

    @Min(value = 1, message = "Số lượng phải ít nhất là 1")
    int quantity;

    // Optional fields for scheduling appointments (when itemType = SERVICE) 
    // or scheduling package treatments (when itemType = PACKAGE)
    String therapistId;
    String roomId;
    LocalDateTime scheduledDateTime;
}
