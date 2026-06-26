package fit.quanlyspa.dto.response.treatment;

import fit.quanlyspa.enums.StatusOfPakage;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TreatmentPackageResponse {
    String treatmentPackageId;
    String packageName;
    int totalSessions;
    double packagePrice;
    String description;
    StatusOfPakage statusOfPakage;
    String employeeId;
    String employeeName;
}
