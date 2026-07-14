package fit.quanlyspa.repository;

import fit.quanlyspa.entity.Invoice;
import fit.quanlyspa.enums.InvoiceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, String> {

    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);
    boolean existsByInvoiceNumber(String invoiceNumber);
    List<Invoice> findByCustomer_CustomerId(String customerId);
    Optional<Invoice> findFirstByAppointment_AppointmentIdAndStatus(String appointmentId, InvoiceStatus status);

    @Query("SELECT i FROM Invoice i WHERE " +
           "(:search IS NULL OR i.invoiceNumber LIKE CONCAT('%', :search, '%') " +
           "OR LOWER(i.customer.name) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:status IS NULL OR i.status = :status)")
    Page<Invoice> searchInvoices(@Param("search") String search,
                                  @Param("status") InvoiceStatus status,
                                  Pageable pageable);

    // Revenue queries for dashboard / reporting
    @Query("SELECT COALESCE(SUM(i.totalAmount), 0) FROM Invoice i WHERE DATE(i.createdAt) = CURRENT_DATE AND i.status = 'PAID'")
    BigDecimal getTodayRevenue();

    @Query("SELECT COALESCE(SUM(i.totalAmount), 0) FROM Invoice i " +
           "WHERE MONTH(i.createdAt) = :month AND YEAR(i.createdAt) = :year AND i.status = 'PAID'")
    BigDecimal getMonthlyRevenue(@Param("month") int month, @Param("year") int year);

    @Query("SELECT MONTH(i.createdAt), COALESCE(SUM(i.totalAmount), 0), COUNT(i) FROM Invoice i " +
           "WHERE YEAR(i.createdAt) = :year AND i.status = 'PAID' " +
           "GROUP BY MONTH(i.createdAt) ORDER BY MONTH(i.createdAt)")
    List<Object[]> getMonthlyRevenueBreakdown(@Param("year") int year);

    @Query("SELECT id.itemName, COALESCE(SUM(id.amount), 0), COUNT(id) FROM InvoiceDetail id " +
           "WHERE id.itemType = 'SERVICE' AND MONTH(id.invoice.createdAt) = :month " +
           "AND YEAR(id.invoice.createdAt) = :year AND id.invoice.status = 'PAID' " +
           "GROUP BY id.itemName ORDER BY SUM(id.amount) DESC")
    List<Object[]> getRevenueByService(@Param("month") int month, @Param("year") int year);

    // Tien von uoc tinh theo thang (cost_price cua san pham/dich vu da ban qua hoa don PAID)
    @Query("SELECT MONTH(d.invoice.createdAt), COALESCE(SUM(CASE " +
           "WHEN d.product IS NOT NULL THEN d.product.costPrice * d.quantity " +
           "WHEN d.service IS NOT NULL THEN d.service.costPrice * d.quantity " +
           "ELSE 0.0 END), 0.0) " +
           "FROM InvoiceDetail d WHERE YEAR(d.invoice.createdAt) = :year AND d.invoice.status = 'PAID' " +
           "GROUP BY MONTH(d.invoice.createdAt)")
    List<Object[]> getMonthlyCostBreakdown(@Param("year") int year);

    // Doanh thu theo ngay trong khoang thoi gian
    @Query("SELECT DATE(i.createdAt), COALESCE(SUM(i.totalAmount), 0), COUNT(i) FROM Invoice i " +
           "WHERE i.status = 'PAID' AND i.createdAt >= :from AND i.createdAt < :to " +
           "GROUP BY DATE(i.createdAt) ORDER BY DATE(i.createdAt)")
    List<Object[]> getDailyRevenue(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    // San pham ban chay trong khoang thoi gian
    @Query("SELECT d.itemName, COALESCE(SUM(d.quantity), 0), COALESCE(SUM(d.amount), 0) FROM InvoiceDetail d " +
           "WHERE d.itemType = 'PRODUCT' AND d.invoice.status = 'PAID' " +
           "AND d.invoice.createdAt >= :from AND d.invoice.createdAt < :to " +
           "GROUP BY d.itemName ORDER BY SUM(d.quantity) DESC")
    List<Object[]> getTopProducts(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
}
