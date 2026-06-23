package fit.quanlyspa.dto.response.treatment;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TreatmentSessionResponse {
    String sessionId;
    String scheduleId;
    int sessionNumber;
    LocalDateTime startTime;
    LocalDateTime endTime;
    String therapistId;
    String therapistName;
    String notes;
    String beforeImages;
    String afterImages;
    String result;
    LocalDateTime createdAt;
}
