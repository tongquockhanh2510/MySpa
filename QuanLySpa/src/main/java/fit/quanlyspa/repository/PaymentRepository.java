package fit.quanlyspa.repository;

import fit.quanlyspa.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, String> {

    @Query("SELECT p FROM Payment p WHERE p.order.orderId = :orderId")
    List<Payment> findByOrderId(@Param("orderId") String orderId);
}
