package fit.quanlyspa.repository;

import fit.quanlyspa.entity.LoyaltyPoint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoyaltyPointRepository extends JpaRepository<LoyaltyPoint, String> {

    @Query("SELECT lp FROM LoyaltyPoint lp WHERE lp.customer.customerId = :customerId ORDER BY lp.createdAt DESC")
    List<LoyaltyPoint> findByCustomerId(@Param("customerId") String customerId);
}
