package fit.quanlyspa.dto.request.treatment;

import fit.quanlyspa.enums.StatusOfPakage;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class TreatmentPackageRequest {
    String treatmentPackageId;
    @NotBlank
    String packageName;
    @Positive
    int totalSessions;
    @Positive
    double packagePrice;
    @NotBlank
    String description;
    StatusOfPakage statusOfPakage;
    String employeeId;
}
