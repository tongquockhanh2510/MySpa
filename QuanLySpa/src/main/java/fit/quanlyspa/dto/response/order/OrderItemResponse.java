package fit.quanlyspa.dto.response.order;

import fit.quanlyspa.enums.OrderItemType;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderItemResponse {
    Long orderItemId;
    OrderItemType itemType;
    int quantity;
    BigDecimal unitPrice;
    BigDecimal amount;

    // Details depending on type
    String productId;
    String productName;
    String productSku;

    String serviceId;
    String serviceName;

    String packageId;
    String packageName;
}
