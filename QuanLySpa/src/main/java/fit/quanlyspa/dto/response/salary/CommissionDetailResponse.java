package fit.quanlyspa.dto.response.salary;

import fit.quanlyspa.enums.CommissionType;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CommissionDetailResponse {
    String commissionId;
    String employeeId;
    String employeeName;
    CommissionType commissionType;
    double baseAmount;
    double commissionRate;    // percentage, e.g. 10.0 = 10%
    double commissionAmount;
    String referenceId;
    String description;
    int month;
    int year;
    boolean paid;
    LocalDateTime createdAt;
}
