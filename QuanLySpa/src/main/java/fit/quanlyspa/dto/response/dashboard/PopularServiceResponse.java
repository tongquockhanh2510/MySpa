package fit.quanlyspa.dto.response.dashboard;

import lombok.*;
import lombok.experimental.FieldDefaults;
import java.math.BigDecimal;

@Data @AllArgsConstructor @NoArgsConstructor @Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PopularServiceResponse {
    String serviceName;
    long bookingCount;
    BigDecimal totalRevenue;
}
