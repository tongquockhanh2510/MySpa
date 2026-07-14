package fit.quanlyspa.dto.response.subscription;

import fit.quanlyspa.enums.PaymentStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class SubscriptionPaymentResponse {
    private String paymentId;
    private String subscriptionId;
    private String planName;
    private BigDecimal amount;
    private PaymentStatus status;
    private String paymentMemo;
    private String transactionReference;
    private LocalDateTime createdAt;
    private LocalDateTime paidAt;
}
