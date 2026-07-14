package fit.quanlyspa.repository;

import fit.quanlyspa.entity.Salary;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SalaryRepository extends JpaRepository<Salary, String> {
    Optional<Salary> findByEmployee_EmployeeIdAndMonthAndYear(String employeeId, int month, int year);
}
