package fit.quanlyspa.dto.request.order;

import fit.quanlyspa.enums.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PaymentProcessRequest {

    @NotNull(message = "Số tiền thanh toán không được để trống")
    @Positive(message = "Số tiền thanh toán phải lớn hơn 0")
    BigDecimal amount;

    @NotNull(message = "Phương thức thanh toán không được để trống")
    PaymentMethod paymentMethod;

    String transactionReference;
    String notes;
}
