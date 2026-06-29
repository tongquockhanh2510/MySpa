package fit.quanlyspa.repository;

import fit.quanlyspa.entity.Appointment;
import fit.quanlyspa.enums.StatusOfAppointment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, String> {

    List<Appointment> findByCustomer_CustomerId(String customerId);

    // Business Rule: Overlapping appointment for same customer
    @Query("SELECT a FROM Appointment a WHERE a.customer.customerId = :customerId " +
           "AND a.statusOfAppointment NOT IN ('CANCELLED', 'NO_SHOW') " +
           "AND a.dateTime < :endTime AND a.endTime > :startTime " +
           "AND (:excludeId IS NULL OR a.appointmentId != :excludeId)")
    List<Appointment> findOverlappingForCustomer(@Param("customerId") String customerId,
                                                  @Param("startTime") LocalDateTime startTime,
                                                  @Param("endTime") LocalDateTime endTime,
                                                  @Param("excludeId") String excludeId);

    // Business Rule: Room conflict
    @Query("SELECT a FROM Appointment a WHERE a.room.roomId = :roomId " +
           "AND a.statusOfAppointment NOT IN ('CANCELLED', 'NO_SHOW') " +
           "AND a.dateTime < :endTime AND a.endTime > :startTime " +
           "AND (:excludeId IS NULL OR a.appointmentId != :excludeId)")
    List<Appointment> findRoomConflicts(@Param("roomId") String roomId,
                                         @Param("startTime") LocalDateTime startTime,
                                         @Param("endTime") LocalDateTime endTime,
                                         @Param("excludeId") String excludeId);

    @Query("SELECT a FROM Appointment a JOIN a.details d WHERE d.employee.employeeId = :employeeId " +
           "AND a.statusOfAppointment NOT IN ('CANCELLED', 'NO_SHOW', 'COMPLETED') " +
           "AND a.dateTime < :endTime AND a.endTime > :startTime " +
           "AND (:excludeId IS NULL OR a.appointmentId != :excludeId)")
    List<Appointment> findTherapistConflicts(@Param("employeeId") String employeeId,
                                             @Param("startTime") LocalDateTime startTime,
                                             @Param("endTime") LocalDateTime endTime,
                                             @Param("excludeId") String excludeId);

    // For dashboard: today's appointments
    @Query("SELECT a FROM Appointment a WHERE DATE(a.dateTime) = CURRENT_DATE " +
           "ORDER BY a.dateTime ASC")
    List<Appointment> findTodayAppointments();

    @Query("SELECT COUNT(a) FROM Appointment a WHERE DATE(a.dateTime) = CURRENT_DATE")
    long countTodayAppointments();

    // Upcoming appointments (PENDING/CONFIRMED)
    @Query("SELECT a FROM Appointment a WHERE a.dateTime >= :from " +
           "AND a.statusOfAppointment IN ('PENDING', 'CONFIRMED') " +
           "ORDER BY a.dateTime ASC")
    List<Appointment> findUpcomingAppointments(@Param("from") LocalDateTime from, Pageable pageable);

    // Search with filters
    @Query("SELECT a FROM Appointment a JOIN a.customer c WHERE " +
           "(:search IS NULL OR LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR c.phone LIKE CONCAT('%', :search, '%')) " +
           "AND (:status IS NULL OR a.statusOfAppointment = :status)")
    Page<Appointment> searchAppointments(@Param("search") String search,
                                          @Param("status") StatusOfAppointment status,
                                          Pageable pageable);

    // No-show detection
    @Query("SELECT a FROM Appointment a WHERE a.statusOfAppointment IN ('PENDING', 'CONFIRMED') " +
           "AND a.dateTime < :cutoffTime")
    List<Appointment> findOverdueAppointments(@Param("cutoffTime") LocalDateTime cutoffTime);

    // Revenue reporting
    @Query("SELECT MONTH(a.dateTime), COUNT(a) FROM Appointment a " +
           "WHERE YEAR(a.dateTime) = :year AND a.statusOfAppointment = 'COMPLETED' " +
           "GROUP BY MONTH(a.dateTime)")
    List<Object[]> countCompletedByMonth(@Param("year") int year);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.statusOfAppointment = 'CANCELLED' " +
           "AND MONTH(a.dateTime) = :month AND YEAR(a.dateTime) = :year")
    long countCancelledByMonth(@Param("month") int month, @Param("year") int year);
}
