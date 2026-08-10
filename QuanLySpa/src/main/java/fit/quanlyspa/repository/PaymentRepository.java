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

    // ISS-012: Tiền thực thu trong tháng (mọi khoản thanh toán thành công, gồm thanh toán một phần)
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p " +
           "WHERE p.status = fit.quanlyspa.enums.PaymentStatus.SUCCESS " +
           "AND MONTH(p.processedAt) = :month AND YEAR(p.processedAt) = :year")
    java.math.BigDecimal getCollectedInMonth(@Param("month") int month, @Param("year") int year);
}
