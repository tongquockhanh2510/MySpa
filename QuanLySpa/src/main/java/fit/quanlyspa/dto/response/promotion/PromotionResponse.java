package fit.quanlyspa.dto.response.promotion;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class PromotionResponse {
    String promotionId;
    String name;
    String code;
    BigDecimal minOrderValue;
    LocalDateTime effective;
    LocalDateTime expiration;
    Integer quantity;
    Boolean isActive;
    LocalDateTime createAt;
    String type;
    double discount;
    double percent;
    double maxDiscount;
    String applyScope;
    String targetType;
    String targetId;
}
