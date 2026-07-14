package fit.quanlyspa.dto.response.subscription;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class SubscriptionCheckoutResponse {
    private SubscriptionResponse subscription;
    private String paymentId;
    private BigDecimal amount;
    private String memo;
    private String qrUrl;
    private String bankBin;
    private String accountNumber;
    private String accountName;
}
