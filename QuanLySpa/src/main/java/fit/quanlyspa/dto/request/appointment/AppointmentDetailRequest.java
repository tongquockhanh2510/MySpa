package fit.quanlyspa.dto.request.appointment;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AppointmentDetailRequest {

    @NotBlank(message = "Dịch vụ không được để trống")
    String serviceId;

    @NotBlank(message = "Nhân viên không được để trống")
    String employeeId;
}
