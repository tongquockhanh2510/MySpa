package fit.quanlyspa.repository;

import fit.quanlyspa.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, String> {
    Optional<Customer> findByPhone(String phone);
    Optional<Customer> findByEmail(String email);
    boolean existsByPhone(String phone);
    boolean existsByEmail(String email);

    @Query("SELECT c FROM Customer c WHERE c.isActive = true AND (" +
           ":search IS NULL OR LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR c.phone LIKE CONCAT('%', :search, '%') " +
           "OR LOWER(c.displayCode) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(c.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Customer> searchCustomers(@Param("search") String search, Pageable pageable);

    @Query("SELECT COUNT(c) FROM Customer c WHERE MONTH(c.createdAt) = :month AND YEAR(c.createdAt) = :year")
    long countNewCustomersByMonth(@Param("month") int month, @Param("year") int year);

    @Query("SELECT c FROM Customer c ORDER BY c.loyaltyPoints DESC")
    Page<Customer> findTopByLoyaltyPoints(Pageable pageable);
}
