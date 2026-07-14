package fit.quanlyspa.controller;

import fit.quanlyspa.dto.response.ApiResponse;
import fit.quanlyspa.dto.response.dashboard.DashboardStatsResponse;
import fit.quanlyspa.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "API bảng điều khiển & KPI")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    @Operation(summary = "Tổng quan KPI", description = "Lấy tất cả chỉ số hiệu suất chính")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> getStats(@RequestParam(required = false) Integer year) {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getStats(year)));
    }

    @GetMapping("/daily-revenue")
    @Operation(summary = "Doanh thu theo ngày", description = "Doanh thu từng ngày trong tháng (hóa đơn PAID)")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<java.util.List<java.util.Map<String, Object>>>> getDailyRevenue(
            @RequestParam int month, @RequestParam int year) {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getDailyRevenue(month, year)));
    }

    @GetMapping("/top-products")
    @Operation(summary = "Sản phẩm bán chạy", description = "Top sản phẩm theo số lượng bán ra")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<java.util.List<java.util.Map<String, Object>>>> getTopProducts(
            @RequestParam(required = false) Integer month, @RequestParam int year) {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getTopProducts(month, year)));
    }
}
