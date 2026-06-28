package fit.quanlyspa.dto.request.treatment;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TreatmentSessionCompleteRequest {

    String notes;
    String beforeImages;
    String afterImages;
    String result;
}
