package fit.quanlyspa.controller;

import fit.quanlyspa.dto.request.subscription.SubscriptionCheckoutRequest;
import fit.quanlyspa.dto.response.ApiResponse;
import fit.quanlyspa.dto.response.subscription.*;
import fit.quanlyspa.service.SubscriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {
    private final SubscriptionService subscriptionService;

    @GetMapping("/plans")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<SubscriptionPlanResponse>>> getPlans() {
        return ResponseEntity.ok(ApiResponse.success(subscriptionService.getPlans()));
    }

    @GetMapping("/current")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> getCurrent(Principal principal) {
        return ResponseEntity.ok(ApiResponse.success(subscriptionService.getCurrent(principal.getName())));
    }

    @GetMapping("/history")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<SubscriptionResponse>>> getHistory(Principal principal) {
        return ResponseEntity.ok(ApiResponse.success(subscriptionService.getHistory(principal.getName())));
    }

    @GetMapping("/payments")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<SubscriptionPaymentResponse>>> getPayments(Principal principal) {
        return ResponseEntity.ok(ApiResponse.success(subscriptionService.getPayments(principal.getName())));
    }

    @PostMapping("/checkout")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SubscriptionCheckoutResponse>> checkout(
            @Valid @RequestBody SubscriptionCheckoutRequest request, Principal principal) {
        return ResponseEntity.ok(ApiResponse.success(subscriptionService.checkout(principal.getName(), request),
                "Đã tạo yêu cầu đăng ký. Vui lòng thanh toán để kích hoạt."));
    }

    @PostMapping("/cancel")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> cancel(Principal principal) {
        return ResponseEntity.ok(ApiResponse.success(subscriptionService.cancelAtPeriodEnd(principal.getName()),
                "Gói vẫn dùng được đến cuối chu kỳ hiện tại"));
    }

    @PostMapping("/resume")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> resume(Principal principal) {
        return ResponseEntity.ok(ApiResponse.success(subscriptionService.resume(principal.getName()), "Đã bật lại gia hạn"));
    }

    @PostMapping("/webhook/bank")
    public ResponseEntity<Map<String, Object>> webhook(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestHeader(value = "x-api-key", required = false) String apiKey,
            @RequestBody Map<String, Object> payload) {
        String provided = apiKey != null ? apiKey : authorization;
        if (!subscriptionService.isValidWebhookKey(provided)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "API key không hợp lệ"));
        }
        return ResponseEntity.ok(subscriptionService.handleWebhook(payload));
    }
}
