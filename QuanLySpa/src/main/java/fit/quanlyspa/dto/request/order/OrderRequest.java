package fit.quanlyspa.dto.request.order;

import fit.quanlyspa.dto.request.customer.CustomerRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderRequest {

    String customerId; // For Option A: Existing Customer

    @Valid
    CustomerRequest newCustomer; // For Option B: New Customer

    @NotEmpty(message = "Đơn hàng phải chứa ít nhất 1 sản phẩm hoặc dịch vụ")
    @Valid
    List<OrderItemRequest> items;

    String voucherCode;
    String promotionId;
}
