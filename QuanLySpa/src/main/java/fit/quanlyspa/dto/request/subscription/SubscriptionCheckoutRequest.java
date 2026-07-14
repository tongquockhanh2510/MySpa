package fit.quanlyspa.dto.request.subscription;

import fit.quanlyspa.enums.BillingCycle;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SubscriptionCheckoutRequest {
    @NotBlank(message = "Mã gói là bắt buộc")
    private String planCode;

    @NotNull(message = "Chu kỳ thanh toán là bắt buộc")
    private BillingCycle billingCycle;
}
