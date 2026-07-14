package fit.quanlyspa.dto.request.employee;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class EmployeeAccountRequest {

    @NotBlank(message = "Tên đăng nhập không được để trống")
    @Size(min = 4, max = 100, message = "Tên đăng nhập phải từ 4-100 ký tự")
    @Pattern(regexp = "^[a-zA-Z0-9._-]+$", message = "Tên đăng nhập chỉ gồm chữ, số, dấu chấm, gạch dưới, gạch ngang")
    String userName;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 6, message = "Mật khẩu phải có ít nhất 6 ký tự")
    String password;

    // MANAGER / RECEPTIONIST / THERAPIST
    @NotBlank(message = "Vai trò không được để trống")
    String role;
}
