package fit.quanlyspa.controller;

import fit.quanlyspa.dto.request.promotion.PromotionRequest;
import fit.quanlyspa.dto.response.ApiResponse;
import fit.quanlyspa.dto.response.promotion.PromotionResponse;
import fit.quanlyspa.entity.AmountPromotion;
import fit.quanlyspa.entity.PercentPromotion;
import fit.quanlyspa.entity.Promotion;
import fit.quanlyspa.exception.AppException;
import fit.quanlyspa.exception.ErrorCode;
import fit.quanlyspa.repository.AmountPromotionRepository;
import fit.quanlyspa.repository.PercentPromotionRepository;
import fit.quanlyspa.repository.PromotionRepository;
import fit.quanlyspa.repository.PromotionUsageRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/promotions")
@RequiredArgsConstructor
@Tag(name = "Promotions", description = "Promotion management APIs")
public class PromotionController {

    private final PromotionRepository promotionRepository;
    private final AmountPromotionRepository amountPromotionRepository;
    private final PercentPromotionRepository percentPromotionRepository;
    private final PromotionUsageRepository promotionUsageRepository;

    @GetMapping
    @Operation(summary = "List active promotions")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<List<PromotionResponse>>> getAll() {
        List<PromotionResponse> response = promotionRepository.findAll().stream()
                .filter(promotion -> promotion.getIsActive() == null || promotion.getIsActive())
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @Operation(summary = "Create promotion")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<PromotionResponse>> create(@Valid @RequestBody PromotionRequest request) {
        Promotion promotion = buildPromotion(request);
        applyBaseFields(promotion, request);
        Promotion saved = savePromotion(promotion);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(toResponse(saved), "Them khuyen mai thanh cong"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update promotion")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<PromotionResponse>> update(@PathVariable String id, @Valid @RequestBody PromotionRequest request) {
        Promotion existing = promotionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PROMOTION_NOT_FOUND));

        if (isSameType(existing, request.getType())) {
            applyTypedFields(existing, request);
            applyBaseFields(existing, request);
            Promotion saved = savePromotion(existing);
            return ResponseEntity.ok(ApiResponse.success(toResponse(saved), "Cap nhat khuyen mai thanh cong"));
        }

        existing.setIsActive(false);
        savePromotion(existing);
        Promotion replacement = buildPromotion(request);
        applyBaseFields(replacement, request);
        Promotion saved = savePromotion(replacement);
        return ResponseEntity.ok(ApiResponse.success(toResponse(saved), "Cap nhat khuyen mai thanh cong"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Soft delete promotion")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        Promotion promotion = promotionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PROMOTION_NOT_FOUND));
        promotion.setIsActive(false);
        savePromotion(promotion);
        return ResponseEntity.ok(ApiResponse.successNoContent("Da ngung khuyen mai"));
    }

    private Promotion buildPromotion(PromotionRequest request) {
        String type = normalizeType(request.getType());
        if ("AMOUNT".equals(type)) {
            AmountPromotion promotion = new AmountPromotion();
            promotion.setDiscount(request.getDiscount());
            return promotion;
        }
        if ("PERCENT".equals(type)) {
            PercentPromotion promotion = new PercentPromotion();
            promotion.setPercent(request.getPercent());
            promotion.setMaxDiscount(request.getMaxDiscount());
            return promotion;
        }
        throw new AppException(ErrorCode.VALIDATION_ERROR, "Loai khuyen mai khong hop le");
    }

    private void applyTypedFields(Promotion promotion, PromotionRequest request) {
        if (promotion instanceof AmountPromotion amountPromotion) {
            amountPromotion.setDiscount(request.getDiscount());
        } else if (promotion instanceof PercentPromotion percentPromotion) {
            percentPromotion.setPercent(request.getPercent());
            percentPromotion.setMaxDiscount(request.getMaxDiscount());
        }
    }

    private void applyBaseFields(Promotion promotion, PromotionRequest request) {
        if (request.getEffective() != null && request.getExpiration() != null
                && !request.getExpiration().isAfter(request.getEffective())) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Thoi gian ket thuc phai sau thoi gian bat dau");
        }
        if (promotion instanceof PercentPromotion && (request.getPercent() <= 0 || request.getPercent() > 100)) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Phan tram giam phai lon hon 0 va khong vuot qua 100");
        }
        if (promotion instanceof PercentPromotion && request.getMaxDiscount() <= 0) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Khuyen mai phan tram phai co muc giam toi da");
        }
        promotion.setName(request.getName());
        promotion.setCode(request.getCode().trim().toUpperCase());
        promotion.setMinOrderValue(request.getMinOrderValue() == null ? BigDecimal.ZERO : request.getMinOrderValue());
        promotion.setEffective(request.getEffective());
        promotion.setExpiration(request.getExpiration());
        promotion.setQuantity(request.getQuantity());
        if (promotion.getInitialQuantity() == null) {
            promotion.setInitialQuantity(request.getQuantity());
        }
        promotion.setMaxUsesPerCustomer(request.getMaxUsesPerCustomer() == null
                || request.getMaxUsesPerCustomer() <= 0 ? null : request.getMaxUsesPerCustomer());
        promotion.setIsActive(request.getIsActive() == null || request.getIsActive());
        promotion.setApplyScope(request.getApplyScope() == null || request.getApplyScope().isBlank() ? "ORDER" : request.getApplyScope());
        promotion.setTargetType(request.getTargetType());
        promotion.setTargetId(request.getTargetId());
        applyTypedFields(promotion, request);
    }

    private Promotion savePromotion(Promotion promotion) {
        if (promotion instanceof AmountPromotion amountPromotion) {
            return amountPromotionRepository.save(amountPromotion);
        }
        if (promotion instanceof PercentPromotion percentPromotion) {
            return percentPromotionRepository.save(percentPromotion);
        }
        return promotionRepository.save(promotion);
    }

    private boolean isSameType(Promotion promotion, String type) {
        String normalized = normalizeType(type);
        return promotion instanceof AmountPromotion && "AMOUNT".equals(normalized)
                || promotion instanceof PercentPromotion && "PERCENT".equals(normalized);
    }

    private String normalizeType(String type) {
        return type == null ? "" : type.trim().toUpperCase();
    }

    private PromotionResponse toResponse(Promotion promotion) {
        PromotionResponse.PromotionResponseBuilder builder = PromotionResponse.builder()
                .promotionId(promotion.getPromotionId())
                .name(promotion.getName())
                .code(promotion.getCode())
                .minOrderValue(promotion.getMinOrderValue())
                .effective(promotion.getEffective())
                .expiration(promotion.getExpiration())
                .quantity(promotion.getQuantity())
                .initialQuantity(promotion.getInitialQuantity())
                .maxUsesPerCustomer(promotion.getMaxUsesPerCustomer())
                .usedCount(promotionUsageRepository.countByPromotion_PromotionId(promotion.getPromotionId()))
                .isActive(promotion.getIsActive())
                .createAt(promotion.getCreateAt())
                .applyScope(promotion.getApplyScope())
                .targetType(promotion.getTargetType())
                .targetId(promotion.getTargetId());

        if (promotion instanceof AmountPromotion amountPromotion) {
            builder.type("AMOUNT").discount(amountPromotion.getDiscount());
        } else if (promotion instanceof PercentPromotion percentPromotion) {
            builder.type("PERCENT").percent(percentPromotion.getPercent()).maxDiscount(percentPromotion.getMaxDiscount());
        }
        return builder.build();
    }
}
