package fit.quanlyspa.repository;

import fit.quanlyspa.entity.SubscriptionPayment;
import fit.quanlyspa.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SubscriptionPaymentRepository extends JpaRepository<SubscriptionPayment, String> {
    Optional<SubscriptionPayment> findByPaymentMemo(String paymentMemo);
    Optional<SubscriptionPayment> findByPaymentMemoAndStatus(String paymentMemo, PaymentStatus status);
    List<SubscriptionPayment> findBySubscriptionSubscriptionIdAndStatus(String subscriptionId, PaymentStatus status);
    List<SubscriptionPayment> findBySubscriptionOwnerUserIdOrderByCreatedAtDesc(String ownerId);
}
