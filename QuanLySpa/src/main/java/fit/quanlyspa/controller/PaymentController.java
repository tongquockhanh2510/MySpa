package fit.quanlyspa.controller;

import fit.quanlyspa.dto.response.ApiResponse;
import fit.quanlyspa.service.BankPaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Payments", description = "Thanh toán chuyển khoản ngân hàng (VietQR + webhook báo có)")
public class PaymentController {

    private final BankPaymentService bankPaymentService;

    @GetMapping("/bank-qr/{orderId}")
    @Operation(summary = "Sinh mã VietQR cho đơn hàng", description = "QR chứa đúng số tiền còn lại và nội dung chuyển khoản để đối soát tự động")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getBankQr(@PathVariable String orderId) {
        return ResponseEntity.ok(ApiResponse.success(bankPaymentService.buildBankQr(orderId)));
    }

    /**
     * Webhook nhan bao co tu dich vu doi soat (SePay/Casso...).
     * Endpoint nay public nhung yeu cau API key trong header.
     */
    @PostMapping("/webhook/bank")
    @Operation(summary = "Webhook báo có chuyển khoản", description = "Dịch vụ báo có gọi khi tiền về tài khoản; hệ thống tự đối chiếu và ghi nhận thanh toán")
    public ResponseEntity<Map<String, Object>> bankWebhook(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestHeader(value = "x-api-key", required = false) String apiKeyHeader,
            @RequestBody Map<String, Object> payload) {
        String provided = apiKeyHeader != null ? apiKeyHeader : authorization;
        if (!bankPaymentService.isValidApiKey(provided)) {
            log.warn("Webhook bank: API key khong hop le");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "API key không hợp lệ"));
        }
        return ResponseEntity.ok(bankPaymentService.handleIncomingTransfer(payload));
    }
}
