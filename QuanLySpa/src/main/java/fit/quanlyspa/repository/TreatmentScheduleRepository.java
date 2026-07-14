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

    @Query("SELECT ts FROM TreatmentSchedule ts " +
           "WHERE ts.customerTreatment.id.customerId = :customerId " +
           "AND ts.customerTreatment.id.packageId = :packageId " +
           "AND ts.status = 'SCHEDULED'")
    List<TreatmentSchedule> findScheduledByTreatment(@Param("customerId") String customerId,
                                                     @Param("packageId") String packageId);

    @Query("SELECT ts FROM TreatmentSchedule ts " +
           "JOIN FETCH ts.customerTreatment ct " +
           "JOIN FETCH ct.customer " +
           "JOIN FETCH ct.treatmentPackage " +
           "LEFT JOIN FETCH ts.therapist " +
           "LEFT JOIN FETCH ts.room " +
           "WHERE ts.scheduledDate BETWEEN :from AND :to " +
           "ORDER BY ts.scheduledDate ASC, ts.sessionNumber ASC")
    List<TreatmentSchedule> findByScheduledDateBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);
}
