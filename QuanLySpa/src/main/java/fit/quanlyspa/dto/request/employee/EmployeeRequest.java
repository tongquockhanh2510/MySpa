package fit.quanlyspa.dto.request.employee;

import fit.quanlyspa.enums.StatusOfEmployee;
import fit.quanlyspa.enums.EmployeeLevel;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;
import java.util.Set;
import java.time.DayOfWeek;
import java.time.LocalTime;

@Data
public class EmployeeRequest {
    @NotBlank(message = "Ten nhan vien khong duoc de trong")
    @Size(max = 150, message = "Ten nhan vien khong duoc vuot qua 150 ky tu")
    String name;

    @NotBlank(message = "So dien thoai khong duoc de trong")
    @Pattern(regexp = "^(0|\\+84)[0-9]{9}$", message = "So dien thoai khong hop le")
    String phone;

    @NotBlank(message = "Email khong duoc de trong")
    @Email(message = "Email khong hop le")
    String email;

    @NotBlank(message = "Chuc vu khong duoc de trong")
    String position;

    @Min(value = 0, message = "Luong co ban khong duoc am")
    double baseSalary;

    StatusOfEmployee statusOfEmployee;
    LocalDate hireDate;
    EmployeeLevel employeeLevel;
    @Min(value = 0, message = "Hoa hong khong duoc am")
    double commissionRate;
    Set<String> skillServiceIds;
    Set<DayOfWeek> workDays;
    LocalTime shiftStart;
    LocalTime shiftEnd;
}
