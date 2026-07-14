package fit.quanlyspa.controller;

import fit.quanlyspa.dto.response.ApiResponse;
import fit.quanlyspa.dto.response.salary.CommissionDetailResponse;
import fit.quanlyspa.dto.response.salary.EmployeeSalaryResponse;
import fit.quanlyspa.service.CommissionService;
import fit.quanlyspa.dto.request.salary.PayrollUpdateRequest;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/salaries")
@RequiredArgsConstructor
@Tag(name = "Salaries & Commissions", description = "API lương và hoa hồng nhân viên")
public class SalaryController {

    private final CommissionService commissionService;

    @GetMapping
    @Operation(summary = "Bảng lương & hoa hồng nhân viên theo tháng")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<EmployeeSalaryResponse>>> getSalarySummary(
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year
    ) {
        LocalDate now = LocalDate.now();
        int m = month != null ? month : now.getMonthValue();
        int y = year != null ? year : now.getYear();
        return ResponseEntity.ok(ApiResponse.success(commissionService.getSalarySummary(m, y)));
    }

    @GetMapping("/me")
    @Operation(summary = "Bang luong & hoa hong cua nhan vien dang dang nhap")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST', 'THERAPIST')")
    public ResponseEntity<ApiResponse<EmployeeSalaryResponse>> getMySalarySummary(
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year,
            Principal principal
    ) {
        LocalDate now = LocalDate.now();
        int m = month != null ? month : now.getMonthValue();
        int y = year != null ? year : now.getYear();
        return ResponseEntity.ok(ApiResponse.success(
                commissionService.getMySalarySummary(principal.getName(), m, y)));
    }

    @PostMapping("/commissions/backfill")
    @Operation(summary = "Sinh bù hoa hồng cho dữ liệu cũ (lịch đã hoàn thành & gói đã bán)")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Integer>> backfill() {
        int created = commissionService.backfill();
        return ResponseEntity.ok(ApiResponse.success(created,
                "Đã sinh bù " + created + " bản ghi hoa hồng từ dữ liệu cũ"));
    }

    @PutMapping("/{employeeId}/period")
    @Operation(summary = "Cap nhat thuong, phat, ung luong va trang thai ky luong")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<EmployeeSalaryResponse>> updatePayroll(
            @PathVariable String employeeId,
            @RequestParam int month,
            @RequestParam int year,
            @Valid @RequestBody PayrollUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                commissionService.updatePayroll(employeeId, month, year, request)));
    }

    @GetMapping("/{employeeId}/commissions")
    @Operation(summary = "Chi tiết hoa hồng của nhân viên theo tháng")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<CommissionDetailResponse>>> getCommissionDetails(
            @PathVariable String employeeId,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year
    ) {
        LocalDate now = LocalDate.now();
        int m = month != null ? month : now.getMonthValue();
        int y = year != null ? year : now.getYear();
        return ResponseEntity.ok(ApiResponse.success(commissionService.getCommissionDetails(employeeId, m, y)));
    }

    @GetMapping("/me/commissions")
    @Operation(summary = "Chi tiet hoa hong cua nhan vien dang dang nhap theo thang")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST', 'THERAPIST')")
    public ResponseEntity<ApiResponse<List<CommissionDetailResponse>>> getMyCommissionDetails(
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year,
            Principal principal
    ) {
        LocalDate now = LocalDate.now();
        int m = month != null ? month : now.getMonthValue();
        int y = year != null ? year : now.getYear();
        return ResponseEntity.ok(ApiResponse.success(
                commissionService.getMyCommissionDetails(principal.getName(), m, y)));
    }
}
