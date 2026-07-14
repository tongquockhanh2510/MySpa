package fit.quanlyspa.repository;

import fit.quanlyspa.entity.PromotionUsage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PromotionUsageRepository extends JpaRepository<PromotionUsage, String> {
    long countByPromotion_PromotionIdAndCustomer_CustomerId(String promotionId, String customerId);
    long countByPromotion_PromotionId(String promotionId);
    boolean existsByPromotion_PromotionIdAndOrder_OrderId(String promotionId, String orderId);
}
