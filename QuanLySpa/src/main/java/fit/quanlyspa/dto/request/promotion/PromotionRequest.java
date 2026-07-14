package fit.quanlyspa.dto.request.promotion;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class PromotionRequest {
    @NotBlank
    String name;
    @NotBlank
    @Size(min = 4, message = "Ma khuyen mai phai co it nhat 4 ky tu")
    String code;
    BigDecimal minOrderValue;
    LocalDateTime effective;
    LocalDateTime expiration;
    Integer quantity;
    @PositiveOrZero
    Integer maxUsesPerCustomer;
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
