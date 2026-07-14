package fit.quanlyspa.service;

import fit.quanlyspa.dto.request.order.PaymentProcessRequest;
import fit.quanlyspa.entity.Order;
import fit.quanlyspa.enums.OrderStatus;
import fit.quanlyspa.enums.PaymentMethod;
import fit.quanlyspa.exception.AppException;
import fit.quanlyspa.exception.ErrorCode;
import fit.quanlyspa.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Thanh toan chuyen khoan that qua VietQR:
 * - Sinh anh QR (img.vietqr.io) voi dung so tien con lai va noi dung "MYSPA<12 ky tu dau cua ma don>".
 * - Dich vu bao co (SePay/Casso) goi webhook khi tien ve tai khoan; he thong doi chieu noi dung
 *   chuyen khoan de tim don hang va tu dong ghi nhan thanh toan.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class BankPaymentService {

    private static final Pattern MEMO_PATTERN = Pattern.compile("MYSPA([0-9A-Fa-f]{12})");

    private final OrderRepository orderRepository;
    private final OrderService orderService;

    @Value("${payment.bank.bin}")
    private String bankBin;

    @Value("${payment.bank.account-number}")
    private String accountNumber;

    @Value("${payment.bank.account-name}")
    private String accountName;

    @Value("${payment.webhook.api-key}")
    private String webhookApiKey;

    public Map<String, Object> buildBankQr(String orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        if (order.getOrderStatus() == OrderStatus.PAID || order.getOrderStatus() == OrderStatus.COMPLETED) {
            throw new AppException(ErrorCode.INVOICE_ALREADY_PAID, "Đơn hàng đã thanh toán đủ");
        }
        if (order.getOrderStatus() == OrderStatus.CANCELLED) {
            throw new AppException(ErrorCode.INVOICE_CANCELLED, "Đơn hàng đã bị hủy");
        }

        BigDecimal amount = order.getRemainingAmount().setScale(0, java.math.RoundingMode.HALF_UP);
        String memo = buildMemo(orderId);
        String qrUrl = "https://img.vietqr.io/image/" + bankBin + "-" + accountNumber + "-compact2.png"
                + "?amount=" + amount.toPlainString()
                + "&addInfo=" + URLEncoder.encode(memo, StandardCharsets.UTF_8)
                + "&accountName=" + URLEncoder.encode(accountName, StandardCharsets.UTF_8);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("orderId", orderId);
        result.put("amount", amount);
        result.put("memo", memo);
        result.put("qrUrl", qrUrl);
        result.put("bankBin", bankBin);
        result.put("accountNumber", accountNumber);
        result.put("accountName", accountName);
        return result;
    }

    public boolean isValidApiKey(String provided) {
        if (provided == null || provided.isBlank()) return false;
        String normalized = provided.trim();
        if (normalized.toLowerCase(Locale.ROOT).startsWith("apikey ")) {
            normalized = normalized.substring(7).trim();
        }
        return normalized.equals(webhookApiKey);
    }

    /**
     * Xu ly webhook bao co. Tra ve orderId neu doi chieu va ghi nhan thanh cong.
     */
    @Transactional
    public Map<String, Object> handleIncomingTransfer(Map<String, Object> payload) {
        String content = firstNonBlank(payload, "content", "description", "transaction_content", "memo");
        BigDecimal amount = readAmount(payload);
        String reference = firstNonBlank(payload, "referenceCode", "reference_number", "tid", "id");
        String transferType = firstNonBlank(payload, "transferType", "type");

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);

        if (transferType != null && !"in".equalsIgnoreCase(transferType) && !"credit".equalsIgnoreCase(transferType)) {
            result.put("message", "Bỏ qua giao dịch chuyển tiền đi");
            return result;
        }
        if (content == null || amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            result.put("message", "Thiếu nội dung hoặc số tiền, bỏ qua");
            return result;
        }

        Matcher matcher = MEMO_PATTERN.matcher(content.replaceAll("\\s+", ""));
        if (!matcher.find()) {
            log.info("Webhook bank transfer khong khop noi dung MYSPA: {}", content);
            result.put("message", "Không tìm thấy mã đơn trong nội dung chuyển khoản");
            return result;
        }
        String orderKey = matcher.group(1).toLowerCase(Locale.ROOT);

        List<Order> pendingOrders = orderRepository.findByOrderStatusIn(
                List.of(OrderStatus.PENDING_PAYMENT, OrderStatus.PARTIALLY_PAID));
        Order matched = pendingOrders.stream()
                .filter(order -> order.getOrderId().replace("-", "").toLowerCase(Locale.ROOT).startsWith(orderKey))
                .findFirst()
                .orElse(null);

        if (matched == null) {
            log.warn("Webhook bank transfer: khong tim thay don cho ma {}", orderKey);
            result.put("message", "Không tìm thấy đơn hàng đang chờ thanh toán khớp mã");
            return result;
        }

        // Khong ghi nhan qua so tien con lai (chuyen thua se duoc doi chieu thu cong)
        BigDecimal applied = amount.min(matched.getRemainingAmount());
        PaymentProcessRequest payment = new PaymentProcessRequest();
        payment.setAmount(applied);
        payment.setPaymentMethod(PaymentMethod.BANK_TRANSFER);
        payment.setTransactionReference(reference);
        payment.setNotes("Tự động ghi nhận từ webhook chuyển khoản (" + content + ")");
        orderService.processPayment(matched.getOrderId(), payment, "BANK_WEBHOOK");

        log.info("Webhook bank transfer: da ghi nhan {} cho don {}", applied, matched.getOrderId());
        result.put("orderId", matched.getOrderId());
        result.put("appliedAmount", applied);
        result.put("message", "Đã ghi nhận thanh toán");
        return result;
    }

    private String buildMemo(String orderId) {
        return "MYSPA" + orderId.replace("-", "").substring(0, 12).toUpperCase(Locale.ROOT);
    }

    private String firstNonBlank(Map<String, Object> payload, String... keys) {
        for (String key : keys) {
            Object value = payload.get(key);
            if (value != null && !String.valueOf(value).isBlank()) {
                return String.valueOf(value);
            }
        }
        return null;
    }

    private BigDecimal readAmount(Map<String, Object> payload) {
        for (String key : new String[]{"transferAmount", "amount", "creditAmount", "amount_in"}) {
            Object value = payload.get(key);
            if (value instanceof Number number) {
                return BigDecimal.valueOf(number.doubleValue());
            }
            if (value instanceof String text && !text.isBlank()) {
                try {
                    return new BigDecimal(text.replace(",", ""));
                } catch (NumberFormatException ignored) {
                    // thu key tiep theo
                }
            }
        }
        return null;
    }
}
