package fit.quanlyspa.repository;

import fit.quanlyspa.entity.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, String> {

    @Query("SELECT pt FROM PaymentTransaction pt WHERE pt.order.orderId = :orderId")
    List<PaymentTransaction> findByOrderId(@Param("orderId") String orderId);
}
