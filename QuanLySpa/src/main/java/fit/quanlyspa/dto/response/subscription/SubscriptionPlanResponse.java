package fit.quanlyspa.dto.response.subscription;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class SubscriptionPlanResponse {
    private String planId;
    private String code;
    private String name;
    private String description;
    private BigDecimal monthlyPrice;
    private BigDecimal yearlyPrice;
    private Integer maxEmployees;
    private Integer maxAppointmentsPerMonth;
    private List<String> features;
    private boolean popular;
}
