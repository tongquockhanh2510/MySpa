package fit.quanlyspa.repository;

import fit.quanlyspa.entity.SpaSubscription;
import fit.quanlyspa.enums.SubscriptionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface SpaSubscriptionRepository extends JpaRepository<SpaSubscription, String> {
    Optional<SpaSubscription> findFirstByOwnerUserIdAndStatusInOrderByCreatedAtDesc(
            String ownerId, Collection<SubscriptionStatus> statuses);
    List<SpaSubscription> findByOwnerUserIdOrderByCreatedAtDesc(String ownerId);
}
