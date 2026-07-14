package fit.quanlyspa.repository;

import fit.quanlyspa.entity.AppointmentReminderLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AppointmentReminderLogRepository extends JpaRepository<AppointmentReminderLog, String> {
    boolean existsByAppointment_AppointmentIdAndLeadHoursAndChannel(String appointmentId, int leadHours, String channel);
    List<AppointmentReminderLog> findAllByOrderByCreatedAtDesc();
}
