package fit.quanlyspa.repository;

import fit.quanlyspa.entity.TreatmentSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TreatmentScheduleRepository extends JpaRepository<TreatmentSchedule, String> {

    @Query("SELECT ts FROM TreatmentSchedule ts WHERE ts.customerTreatment.customer.customerId = :customerId")
    List<TreatmentSchedule> findByCustomerId(@Param("customerId") String customerId);

    @Query("SELECT ts FROM TreatmentSchedule ts WHERE ts.scheduledDate = :date AND ts.status = 'SCHEDULED'")
    List<TreatmentSchedule> findScheduledForDate(@Param("date") LocalDate date);
}
