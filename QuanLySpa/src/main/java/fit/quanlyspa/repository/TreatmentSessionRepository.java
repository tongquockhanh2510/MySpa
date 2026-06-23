package fit.quanlyspa.repository;

import fit.quanlyspa.entity.TreatmentSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TreatmentSessionRepository extends JpaRepository<TreatmentSession, String> {

    @Query("SELECT ts FROM TreatmentSession ts WHERE ts.treatmentSchedule.scheduleId = :scheduleId")
    List<TreatmentSession> findByScheduleId(@Param("scheduleId") String scheduleId);
}
