package fit.quanlyspa.dto.response.treatment;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class CustomerTreatmentResponse {
    String customerId;
    String packageId;
    String customerName;
    String customerPhone;
    String packageName;
    int totalSessions;
    double packagePrice;
    int remainingSessions;
    LocalDate purchaseDate;
    LocalDate expiryDate;
    LocalDate cancelDate;
    String cancelReason;
    String packageConversionId;
}
