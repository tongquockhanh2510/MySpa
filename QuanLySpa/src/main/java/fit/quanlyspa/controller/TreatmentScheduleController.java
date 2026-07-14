package fit.quanlyspa.controller;

import fit.quanlyspa.dto.response.ApiResponse;
import fit.quanlyspa.dto.response.treatment.TreatmentScheduleResponse;
import fit.quanlyspa.service.TreatmentScheduleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/treatment-schedules")
@RequiredArgsConstructor
@Tag(name = "Treatment Schedules", description = "API quản lý lịch trình điều trị liệu trình")
public class TreatmentScheduleController {

    private final TreatmentScheduleService treatmentScheduleService;

    @GetMapping
    @Operation(summary = "Danh sách buổi liệu trình theo khoảng ngày (hiển thị trên lịch)")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST', 'THERAPIST')")
    public ResponseEntity<ApiResponse<List<TreatmentScheduleResponse>>> getByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        List<TreatmentScheduleResponse> response = treatmentScheduleService.getSchedulesByDateRange(from, to);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/customer/{customerId}")
    @Operation(summary = "Xem lịch trình trị liệu của khách hàng")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST', 'THERAPIST')")
    public ResponseEntity<ApiResponse<List<TreatmentScheduleResponse>>> getByCustomer(@PathVariable String customerId) {
        List<TreatmentScheduleResponse> response = treatmentScheduleService.getSchedulesByCustomerId(customerId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/reschedule")
    @Operation(summary = "Đổi lịch buổi trị liệu")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<TreatmentScheduleResponse>> reschedule(
            @PathVariable String id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String therapistId,
            @RequestParam(required = false) String roomId
    ) {
        TreatmentScheduleResponse response = treatmentScheduleService.reschedule(id, date, therapistId, roomId);
        return ResponseEntity.ok(ApiResponse.success(response, "Thay đổi lịch hẹn buổi trị liệu thành công"));
    }
}
