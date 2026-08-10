package fit.quanlyspa.controller;

import fit.quanlyspa.dto.request.order.OrderRequest;
import fit.quanlyspa.dto.request.order.PaymentProcessRequest;
import fit.quanlyspa.dto.response.ApiResponse;
import fit.quanlyspa.dto.response.order.OrderResponse;
import fit.quanlyspa.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
@Tag(name = "Orders", description = "API quản lý bán hàng và đơn hàng (POS)")
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    @Operation(summary = "Tạo đơn hàng mới (Draft/Pending)")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(
            @Valid @RequestBody OrderRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String username = userDetails != null ? userDetails.getUsername() : "system";
        OrderResponse response = orderService.createOrder(request, username);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response, "Khởi tạo đơn hàng thành công"));
    }

    @PostMapping("/{id}/payments")
    @Operation(summary = "Thanh toán đơn hàng (hỗ trợ thanh toán nhiều lần/một phần)")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<OrderResponse>> processPayment(
            @PathVariable String id,
            @Valid @RequestBody PaymentProcessRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String username = userDetails != null ? userDetails.getUsername() : "system";
        OrderResponse response = orderService.processPayment(id, request, username);
        return ResponseEntity.ok(ApiResponse.success(response, "Thực hiện thanh toán thành công"));
    }

    @PostMapping("/{id}/refund")
    @Operation(summary = "Hoàn/hủy đơn đã thanh toán (trả kho, hồi tố hoa hồng)")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<OrderResponse>> refund(
            @PathVariable String id,
            @RequestParam(required = false) String reason,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String username = userDetails != null ? userDetails.getUsername() : "system";
        OrderResponse response = orderService.refundOrder(id, reason, username);
        return ResponseEntity.ok(ApiResponse.success(response, "Hoàn đơn hàng thành công"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết đơn hàng")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST', 'THERAPIST')")
    public ResponseEntity<ApiResponse<OrderResponse>> getById(@PathVariable String id) {
        OrderResponse response = orderService.getOrderById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "Danh sách tất cả đơn hàng")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getAll() {
        List<OrderResponse> response = orderService.getAllOrders();
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
