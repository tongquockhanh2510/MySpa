package fit.quanlyspa.repository;

import fit.quanlyspa.entity.SubscriptionPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlan, String> {
    List<SubscriptionPlan> findByActiveTrueOrderBySortOrderAsc();
    Optional<SubscriptionPlan> findByCodeAndActiveTrue(String code);
    Optional<SubscriptionPlan> findByCode(String code);
}
