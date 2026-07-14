package fit.quanlyspa.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "salaries")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Salary {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "salary_id")
    String salaryId;
    int month;
    int year;
    @Column(name = "total_working_hours")
    double totalWorkingHours;
    double bonus;
    double penalty;
    @Column(name = "salary_advance")
    double salaryAdvance;
    @Enumerated(EnumType.STRING)
    @Column(name = "payroll_status")
    fit.quanlyspa.enums.PayrollStatus payrollStatus = fit.quanlyspa.enums.PayrollStatus.DRAFT;
    @Column(name = "total_salary")
    double totalSalary;
    @Column(name = "total_commission")
    double totalCommission;
    @ManyToOne
            @JoinColumn(name = "employee_id")
    Employee employee;

}
