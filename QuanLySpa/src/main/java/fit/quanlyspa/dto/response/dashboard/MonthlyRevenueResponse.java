package fit.quanlyspa.dto.response.dashboard;

import lombok.*;
import lombok.experimental.FieldDefaults;
import java.math.BigDecimal;

@Data @AllArgsConstructor @NoArgsConstructor @Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MonthlyRevenueResponse {
    int month;
    int year;
    BigDecimal revenue;
    BigDecimal cost;
    BigDecimal profit;
    long orderCount;
}
