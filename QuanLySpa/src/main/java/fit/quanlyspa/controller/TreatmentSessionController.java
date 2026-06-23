package fit.quanlyspa.controller;

import fit.quanlyspa.dto.request.treatment.TreatmentSessionCreateRequest;
import fit.quanlyspa.dto.response.ApiResponse;
import fit.quanlyspa.dto.response.treatment.TreatmentSessionResponse;
import fit.quanlyspa.service.TreatmentSessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/treatment-sessions")
@RequiredArgsConstructor
@Tag(name = "Treatment Sessions", description = "API thực hiện buổi trị liệu liệu trình (Check-in, Hoàn thành)")
public class TreatmentSessionController {

    private final TreatmentSessionService treatmentSessionService;

    @PostMapping("/check-in")
    @Operation(summary = "Check-in bắt đầu buổi trị liệu")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST', 'THERAPIST')")
    public ResponseEntity<ApiResponse<TreatmentSessionResponse>> startSession(
            @RequestParam String scheduleId,
            @RequestParam(required = false) String therapistId
    ) {
        TreatmentSessionResponse response = treatmentSessionService.startSession(scheduleId, therapistId);
        return ResponseEntity.ok(ApiResponse.success(response, "Bắt đầu phiên trị liệu thành công (Đã check-in)"));
    }

    @PostMapping("/{id}/complete")
    @Operation(summary = "Hoàn thành buổi trị liệu (nhập kết quả, ảnh trước sau)")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'THERAPIST')")
    public ResponseEntity<ApiResponse<TreatmentSessionResponse>> completeSession(
            @PathVariable String id,
            @Valid @RequestBody TreatmentSessionCreateRequest request
    ) {
        TreatmentSessionResponse response = treatmentSessionService.completeSession(
                id, request.getNotes(), request.getBeforeImages(), request.getAfterImages(), request.getResult());
        return ResponseEntity.ok(ApiResponse.success(response, "Đã hoàn thành và lưu kết quả buổi trị liệu thành công"));
    }

    @GetMapping("/schedule/{scheduleId}")
    @Operation(summary = "Lấy danh sách các buổi trị liệu của lịch trình")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST', 'THERAPIST')")
    public ResponseEntity<ApiResponse<List<TreatmentSessionResponse>>> getSessionsBySchedule(@PathVariable String scheduleId) {
        List<TreatmentSessionResponse> response = treatmentSessionService.getSessionsByScheduleId(scheduleId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
