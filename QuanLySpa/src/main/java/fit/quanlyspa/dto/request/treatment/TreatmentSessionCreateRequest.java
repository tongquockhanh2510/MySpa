package fit.quanlyspa.dto.request.treatment;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TreatmentSessionCreateRequest {

    @NotBlank(message = "Mã lịch trình điều trị không được để trống")
    String scheduleId;

    String therapistId; // Optional, if different from scheduled
    String notes;
    String beforeImages;
    String afterImages;
    String result;
}
