package fit.quanlyspa.repository;

import fit.quanlyspa.entity.Commission;
import fit.quanlyspa.enums.CommissionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommissionRepository extends JpaRepository<Commission, String> {

    boolean existsByReferenceIdAndCommissionType(String referenceId, CommissionType commissionType);

    @Query("SELECT c FROM Commission c " +
           "JOIN FETCH c.employee " +
           "WHERE c.employee.employeeId = :employeeId AND c.month = :month AND c.year = :year " +
           "ORDER BY c.createdAt DESC")
    List<Commission> findByEmployeeAndPeriod(@Param("employeeId") String employeeId,
                                             @Param("month") int month,
                                             @Param("year") int year);

    @Query("SELECT c FROM Commission c JOIN FETCH c.employee WHERE c.month = :month AND c.year = :year")
    List<Commission> findByPeriod(@Param("month") int month, @Param("year") int year);

    @Query("SELECT COALESCE(SUM(c.commissionAmount), 0) FROM Commission c " +
           "WHERE c.employee.employeeId = :employeeId AND c.month = :month AND c.year = :year")
    double sumByEmployeeAndPeriod(@Param("employeeId") String employeeId,
                                  @Param("month") int month,
                                  @Param("year") int year);

    // Top nhan vien theo doanh thu dich vu/goi da phuc vu trong nam
    @Query("SELECT c.employee.employeeId, c.employee.name, c.employee.position, " +
           "COUNT(c), COALESCE(SUM(c.baseAmount), 0), COALESCE(SUM(c.commissionAmount), 0) " +
           "FROM Commission c WHERE c.year = :year " +
           "GROUP BY c.employee.employeeId, c.employee.name, c.employee.position " +
           "ORDER BY SUM(c.baseAmount) DESC")
    List<Object[]> getTopEmployeesByYear(@Param("year") int year);
}
