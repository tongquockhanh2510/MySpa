package fit.quanlyspa.dto.request.promotion;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class PromotionRequest {
    @NotBlank
    String name;
    @NotBlank
    String code;
    BigDecimal minOrderValue;
    LocalDateTime effective;
    LocalDateTime expiration;
    Integer quantity;
    Boolean isActive;
    @NotBlank
    String type;
    @PositiveOrZero
    double discount;
    @PositiveOrZero
    double percent;
    @PositiveOrZero
    double maxDiscount;
    String applyScope;
    String targetType;
    String targetId;
}
