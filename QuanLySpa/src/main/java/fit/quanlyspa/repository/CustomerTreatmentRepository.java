package fit.quanlyspa.repository;

import fit.quanlyspa.entity.CustomerTreatment;
import fit.quanlyspa.entity.CustomerTreatmentId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface CustomerTreatmentRepository extends JpaRepository<CustomerTreatment, CustomerTreatmentId> {

    List<CustomerTreatment> findByCustomer_CustomerId(String customerId);

    @Query("SELECT ct FROM CustomerTreatment ct " +
           "LEFT JOIN FETCH ct.customer " +
           "LEFT JOIN FETCH ct.treatmentPackage " +
           "ORDER BY ct.purchaseDate DESC")
    List<CustomerTreatment> findAllWithDetails();

    @Query("SELECT ct FROM CustomerTreatment ct " +
           "LEFT JOIN FETCH ct.customer " +
           "LEFT JOIN FETCH ct.treatmentPackage " +
           "WHERE ct.customer.customerId = :customerId " +
           "ORDER BY ct.purchaseDate DESC")
    List<CustomerTreatment> findByCustomerIdWithDetails(@Param("customerId") String customerId);

    @Query("SELECT ct FROM CustomerTreatment ct WHERE ct.remainingSessions > 0 AND ct.expiryDate >= :today")
    List<CustomerTreatment> findActiveByCustomer(@Param("today") LocalDate today);

    @Query("SELECT ct FROM CustomerTreatment ct WHERE ct.expiryDate BETWEEN :today AND :threshold")
    List<CustomerTreatment> findExpiringPackages(@Param("today") LocalDate today, @Param("threshold") LocalDate threshold);

    @Query("SELECT COUNT(ct) FROM CustomerTreatment ct WHERE MONTH(ct.purchaseDate) = :month AND YEAR(ct.purchaseDate) = :year")
    long countSoldByMonth(@Param("month") int month, @Param("year") int year);

    @Query("SELECT ct FROM CustomerTreatment ct JOIN ct.customer c WHERE " +
           "(:search IS NULL OR LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR c.phone LIKE CONCAT('%', :search, '%'))")
    Page<CustomerTreatment> searchCustomerTreatments(@Param("search") String search, Pageable pageable);
}
