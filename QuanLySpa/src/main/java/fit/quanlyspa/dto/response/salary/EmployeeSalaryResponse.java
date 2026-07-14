package fit.quanlyspa.dto.response.salary;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class EmployeeSalaryResponse {
    String employeeId;
    String employeeName;
    String position;
    int month;
    int year;
    double baseSalary;
    double totalCommission;
    int commissionCount;
    double bonus;
    double penalty;
    double salaryAdvance;
    fit.quanlyspa.enums.PayrollStatus payrollStatus;
    double totalSalary;       // baseSalary + totalCommission
}
