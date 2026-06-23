package fit.quanlyspa.dto.request.customer;

import fit.quanlyspa.enums.Gender;
import jakarta.validation.constraints.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CustomerRequest {

    @NotBlank(message = "Tên khách hàng không được để trống")
    @Size(max = 150, message = "Tên không được vượt quá 150 ký tự")
    String name;

    @Pattern(regexp = "^(0|\\+84)[3-9][0-9]{8}$", message = "Số điện thoại không hợp lệ")
    String phone;

    @Email(message = "Email không hợp lệ")
    String email;

    Gender gender;

    LocalDate dateOfBirth;

    @Size(max = 300, message = "Địa chỉ không được vượt quá 300 ký tự")
    String address;

    String skinType;
    String allergyInfo;
    String note;
    String referredBy;
}
