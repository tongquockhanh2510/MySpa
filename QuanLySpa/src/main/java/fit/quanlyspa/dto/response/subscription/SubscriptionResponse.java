package fit.quanlyspa.dto.response.subscription;

import fit.quanlyspa.enums.BillingCycle;
import fit.quanlyspa.enums.SubscriptionStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class SubscriptionResponse {
    private String subscriptionId;
    private SubscriptionPlanResponse plan;
    private BillingCycle billingCycle;
    private SubscriptionStatus status;
    private LocalDateTime currentPeriodStart;
    private LocalDateTime currentPeriodEnd;
    private boolean autoRenew;
    private boolean cancelAtPeriodEnd;
    private LocalDateTime activatedAt;
    private LocalDateTime cancelledAt;
    private LocalDateTime createdAt;
}
