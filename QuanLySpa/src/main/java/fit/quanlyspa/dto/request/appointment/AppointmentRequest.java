package fit.quanlyspa.dto.request.appointment;

import jakarta.validation.constraints.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AppointmentRequest {

    @NotBlank(message = "Khách hàng không được để trống")
    String customerId;

    @NotNull(message = "Ngày giờ hẹn không được để trống")
    @Future(message = "Ngày giờ hẹn phải trong tương lai")
    LocalDateTime dateTime;

    String roomId;
    String note;

    @NotEmpty(message = "Phải có ít nhất một dịch vụ")
    List<AppointmentDetailRequest> details;
}
