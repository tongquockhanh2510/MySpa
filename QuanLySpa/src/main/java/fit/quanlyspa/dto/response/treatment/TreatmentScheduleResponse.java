package fit.quanlyspa.dto.response.treatment;

import fit.quanlyspa.enums.TreatmentScheduleStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TreatmentScheduleResponse {
    String scheduleId;
    String customerId;
    String customerName;
    String customerPhone;
    String packageId;
    String packageName;
    int sessionNumber;
    LocalDate scheduledDate;
    String therapistId;
    String therapistName;
    String roomId;
    String roomName;
    TreatmentScheduleStatus status;
}
