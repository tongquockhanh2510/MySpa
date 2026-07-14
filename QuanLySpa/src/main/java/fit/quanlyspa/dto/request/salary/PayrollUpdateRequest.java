package fit.quanlyspa.dto.request.salary;

import fit.quanlyspa.enums.PayrollStatus;
import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
public class PayrollUpdateRequest {
    @Min(0) double bonus;
    @Min(0) double penalty;
    @Min(0) double salaryAdvance;
    PayrollStatus status;
}
