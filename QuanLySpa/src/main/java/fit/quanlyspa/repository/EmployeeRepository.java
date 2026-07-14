package fit.quanlyspa.repository;

import fit.quanlyspa.entity.Employee;
import fit.quanlyspa.enums.StatusOfEmployee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, String> {
    Optional<Employee> findByPhone(String phone);
    Optional<Employee> findByEmail(String email);
    Optional<Employee> findByUser_UserName(String userName);
    boolean existsByPhone(String phone);
    boolean existsByEmail(String email);
    boolean existsByPhoneAndEmployeeIdNot(String phone, String employeeId);
    boolean existsByEmailAndEmployeeIdNot(String email, String employeeId);
    List<Employee> findByStatusOfEmployee(StatusOfEmployee status);
    long countByStatusOfEmployee(StatusOfEmployee status);

    @Query("SELECT e FROM Employee e WHERE " +
           "(:search IS NULL OR LOWER(e.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR e.phone LIKE CONCAT('%', :search, '%') " +
           "OR LOWER(e.position) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:status IS NULL OR e.statusOfEmployee = :status)")
    Page<Employee> searchEmployees(@Param("search") String search,
                                   @Param("status") StatusOfEmployee status,
                                   Pageable pageable);

    // Find employees available (no appointment) in a time slot
    @Query("SELECT e FROM Employee e WHERE e.statusOfEmployee = 'ACTIVE' " +
           "AND e.employeeId NOT IN (" +
           "  SELECT ad.employee.employeeId FROM AppoinmentDetail ad " +
           "  JOIN ad.appointment a " +
           "  WHERE a.statusOfAppointment NOT IN ('CANCELLED', 'NO_SHOW', 'COMPLETED') " +
           "  AND a.dateTime < :endTime AND a.endTime > :startTime" +
           ")")
    List<Employee> findAvailableEmployees(@Param("startTime") LocalDateTime startTime,
                                          @Param("endTime") LocalDateTime endTime);
}
