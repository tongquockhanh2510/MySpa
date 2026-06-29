package fit.quanlyspa.controller;

import fit.quanlyspa.dto.request.appointment.AppointmentRequest;
import fit.quanlyspa.dto.response.ApiResponse;
import fit.quanlyspa.dto.response.appointment.AppointmentResponse;
import fit.quanlyspa.enums.StatusOfAppointment;
import fit.quanlyspa.service.AppointmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/appointments")
@RequiredArgsConstructor
@Tag(name = "Appointments", description = "API quản lý lịch hẹn")
public class AppointmentController {

    private final AppointmentService appointmentService;

    @GetMapping
    @Operation(summary = "Danh sách lịch hẹn")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST', 'THERAPIST')")
    public ResponseEntity<ApiResponse<?>> getAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) StatusOfAppointment status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        var result = appointmentService.getAll(search, status, PageRequest.of(page, size, Sort.by("dateTime").descending()));
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết lịch hẹn")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST', 'THERAPIST')")
    public ResponseEntity<ApiResponse<AppointmentResponse>> getById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(appointmentService.getById(id)));
    }

    @PostMapping
    @Operation(summary = "Đặt lịch hẹn mới")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<AppointmentResponse>> create(
            @Valid @RequestBody AppointmentRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        AppointmentResponse apt = appointmentService.create(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(apt, "Đặt lịch hẹn thành công"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cap nhat lich hen")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<AppointmentResponse>> update(
            @PathVariable String id,
            @Valid @RequestBody AppointmentRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(appointmentService.update(id, request), "Cap nhat lich hen thanh cong"));
    }

    @PatchMapping("/{id}/confirm")
    @Operation(summary = "Xác nhận lịch hẹn")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<AppointmentResponse>> confirm(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(appointmentService.confirm(id), "Đã xác nhận lịch hẹn"));
    }

    @PatchMapping("/{id}/checkin")
    @Operation(summary = "Check-in khách hàng")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<AppointmentResponse>> checkIn(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(appointmentService.checkIn(id), "Check-in thành công"));
    }

    @PatchMapping("/{id}/start")
    @Operation(summary = "Bắt đầu điều trị")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'THERAPIST')")
    public ResponseEntity<ApiResponse<AppointmentResponse>> startTreatment(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(appointmentService.startTreatment(id), "Đã bắt đầu điều trị"));
    }

    @PatchMapping("/{id}/complete")
    @Operation(summary = "Hoàn thành lịch hẹn")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'THERAPIST')")
    public ResponseEntity<ApiResponse<AppointmentResponse>> complete(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(appointmentService.complete(id), "Lịch hẹn đã hoàn thành"));
    }

    @PatchMapping("/{id}/cancel")
    @Operation(summary = "Hủy lịch hẹn")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<AppointmentResponse>> cancel(
            @PathVariable String id,
            @RequestParam(required = false, defaultValue = "Khách hàng yêu cầu hủy") String reason
    ) {
        return ResponseEntity.ok(ApiResponse.success(appointmentService.cancel(id, reason), "Đã hủy lịch hẹn"));
    }

    @PatchMapping("/{id}/no-show")
    @Operation(summary = "Đánh dấu không đến")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<AppointmentResponse>> markNoShow(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(appointmentService.markNoShow(id), "Đã đánh dấu vắng mặt"));
    }

    @PatchMapping("/{id}/reschedule")
    @Operation(summary = "Dời lịch hẹn")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<AppointmentResponse>> reschedule(
            @PathVariable String id,
            @RequestParam LocalDateTime newDateTime
    ) {
        return ResponseEntity.ok(ApiResponse.success(appointmentService.reschedule(id, newDateTime), "Đã dời lịch thành công"));
    }
}
