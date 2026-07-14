package fit.quanlyspa.controller;

import fit.quanlyspa.dto.response.ApiResponse;
import fit.quanlyspa.dto.response.notification.NotificationResponse;
import fit.quanlyspa.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "API thông báo nội bộ")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @Operation(summary = "Danh sách thông báo")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST', 'THERAPIST')")
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getAll(
            @RequestParam(defaultValue = "false") boolean unreadOnly,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(ApiResponse.success(notificationService.getNotifications(unreadOnly, size)));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Số thông báo chưa đọc")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST', 'THERAPIST')")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount() {
        return ResponseEntity.ok(ApiResponse.success(Map.of("count", notificationService.getUnreadCount())));
    }

    @PutMapping("/{id}/read")
    @Operation(summary = "Đánh dấu đã đọc")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST', 'THERAPIST')")
    public ResponseEntity<ApiResponse<NotificationResponse>> markRead(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(notificationService.markRead(id)));
    }

    @PutMapping("/read-all")
    @Operation(summary = "Đánh dấu tất cả đã đọc")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST', 'THERAPIST')")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> markAllRead() {
        return ResponseEntity.ok(ApiResponse.success(Map.of("updated", notificationService.markAllRead())));
    }
}
