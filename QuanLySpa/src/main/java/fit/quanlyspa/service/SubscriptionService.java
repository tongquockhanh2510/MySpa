package fit.quanlyspa.service;

import fit.quanlyspa.dto.request.subscription.SubscriptionCheckoutRequest;
import fit.quanlyspa.dto.response.subscription.*;
import fit.quanlyspa.entity.*;
import fit.quanlyspa.enums.*;
import fit.quanlyspa.exception.AppException;
import fit.quanlyspa.exception.ErrorCode;
import fit.quanlyspa.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubscriptionService {
    private static final Pattern MEMO_PATTERN = Pattern.compile("SUB[0-9A-F]{12}", Pattern.CASE_INSENSITIVE);
    private static final List<SubscriptionStatus> CURRENT_STATUSES = List.of(SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL);

    private final SubscriptionPlanRepository planRepository;
    private final SpaSubscriptionRepository subscriptionRepository;
    private final SubscriptionPaymentRepository paymentRepository;
    private final UserRepository userRepository;

    @Value("${payment.bank.bin}") private String bankBin;
    @Value("${payment.bank.account-number}") private String accountNumber;
    @Value("${payment.bank.account-name}") private String accountName;
    @Value("${payment.webhook.api-key}") private String webhookApiKey;

    @Transactional(readOnly = true)
    public List<SubscriptionPlanResponse> getPlans() {
        return planRepository.findByActiveTrueOrderBySortOrderAsc().stream().map(this::toPlanResponse).toList();
    }

    @Transactional
    public SubscriptionResponse getCurrent(String username) {
        User owner = requireUser(username);
        return subscriptionRepository.findFirstByOwnerUserIdAndStatusInOrderByCreatedAtDesc(owner.getUserId(), CURRENT_STATUSES)
                .map(subscription -> {
                    expireIfNeeded(subscription);
                    return subscription.getStatus() == SubscriptionStatus.EXPIRED ? null : toResponse(subscription);
                }).orElse(null);
    }

    @Transactional(readOnly = true)
    public List<SubscriptionResponse> getHistory(String username) {
        return subscriptionRepository.findByOwnerUserIdOrderByCreatedAtDesc(requireUser(username).getUserId())
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<SubscriptionPaymentResponse> getPayments(String username) {
        return paymentRepository.findBySubscriptionOwnerUserIdOrderByCreatedAtDesc(requireUser(username).getUserId())
                .stream().map(this::toPaymentResponse).toList();
    }

    @Transactional
    public SubscriptionCheckoutResponse checkout(String username, SubscriptionCheckoutRequest request) {
        User owner = requireUser(username);
        SubscriptionPlan plan = planRepository.findByCodeAndActiveTrue(request.getPlanCode().trim().toUpperCase(Locale.ROOT))
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy gói dịch vụ"));

        subscriptionRepository.findFirstByOwnerUserIdAndStatusInOrderByCreatedAtDesc(owner.getUserId(), CURRENT_STATUSES)
                .ifPresent(current -> {
                    expireIfNeeded(current);
                    if (current.getStatus() != SubscriptionStatus.EXPIRED
                            && current.getPlan().getPlanId().equals(plan.getPlanId())
                            && current.getBillingCycle() == request.getBillingCycle()) {
                        throw new AppException(ErrorCode.DUPLICATE_RESOURCE, "Gói dịch vụ này đang được sử dụng");
                    }
                });

        subscriptionRepository.findByOwnerUserIdOrderByCreatedAtDesc(owner.getUserId()).stream()
                .filter(item -> item.getStatus() == SubscriptionStatus.PENDING)
                .forEach(item -> {
                    item.setStatus(SubscriptionStatus.CANCELLED);
                    item.setCancelledAt(LocalDateTime.now());
                    subscriptionRepository.save(item);
                    paymentRepository.findBySubscriptionSubscriptionIdAndStatus(item.getSubscriptionId(), PaymentStatus.PENDING)
                            .forEach(oldPayment -> {
                                oldPayment.setStatus(PaymentStatus.FAILED);
                                paymentRepository.save(oldPayment);
                            });
                });

        SpaSubscription subscription = subscriptionRepository.save(SpaSubscription.builder()
                .owner(owner).plan(plan).billingCycle(request.getBillingCycle())
                .status(SubscriptionStatus.PENDING).autoRenew(true).build());
        BigDecimal amount = request.getBillingCycle() == BillingCycle.YEARLY ? plan.getYearlyPrice() : plan.getMonthlyPrice();
        String memo = "SUB" + subscription.getSubscriptionId().replace("-", "").substring(0, 12).toUpperCase(Locale.ROOT);
        SubscriptionPayment payment = paymentRepository.save(SubscriptionPayment.builder()
                .subscription(subscription).amount(amount).status(PaymentStatus.PENDING).paymentMemo(memo).build());

        String qrUrl = "https://img.vietqr.io/image/" + bankBin + "-" + accountNumber + "-compact2.png"
                + "?amount=" + amount.setScale(0, RoundingMode.HALF_UP).toPlainString()
                + "&addInfo=" + URLEncoder.encode(memo, StandardCharsets.UTF_8)
                + "&accountName=" + URLEncoder.encode(accountName, StandardCharsets.UTF_8);
        return SubscriptionCheckoutResponse.builder().subscription(toResponse(subscription)).paymentId(payment.getPaymentId())
                .amount(amount).memo(memo).qrUrl(qrUrl).bankBin(bankBin).accountNumber(accountNumber)
                .accountName(accountName).build();
    }

    @Transactional
    public SubscriptionResponse cancelAtPeriodEnd(String username) {
        SpaSubscription current = requireCurrent(username);
        current.setCancelAtPeriodEnd(true);
        current.setAutoRenew(false);
        current.setCancelledAt(LocalDateTime.now());
        return toResponse(subscriptionRepository.save(current));
    }

    @Transactional
    public SubscriptionResponse resume(String username) {
        SpaSubscription current = requireCurrent(username);
        current.setCancelAtPeriodEnd(false);
        current.setAutoRenew(true);
        current.setCancelledAt(null);
        return toResponse(subscriptionRepository.save(current));
    }

    public boolean isValidWebhookKey(String provided) {
        if (provided == null || provided.isBlank()) return false;
        String normalized = provided.trim();
        if (normalized.regionMatches(true, 0, "Apikey ", 0, 7)) normalized = normalized.substring(7).trim();
        return MessageDigest.isEqual(normalized.getBytes(StandardCharsets.UTF_8), webhookApiKey.getBytes(StandardCharsets.UTF_8));
    }

    @Transactional
    public Map<String, Object> handleWebhook(Map<String, Object> payload) {
        String content = firstNonBlank(payload, "content", "description", "transaction_content", "memo");
        BigDecimal amount = readAmount(payload);
        String reference = firstNonBlank(payload, "referenceCode", "reference_number", "tid", "id");
        String transferType = firstNonBlank(payload, "transferType", "type");
        if (transferType != null && !"in".equalsIgnoreCase(transferType) && !"credit".equalsIgnoreCase(transferType))
            return Map.of("success", true, "message", "Bỏ qua giao dịch chuyển tiền đi");
        if (content == null || amount == null) return Map.of("success", true, "message", "Bỏ qua giao dịch thiếu dữ liệu");
        Matcher matcher = MEMO_PATTERN.matcher(content.replaceAll("\\s+", ""));
        if (!matcher.find()) return Map.of("success", true, "message", "Không tìm thấy mã đăng ký");

        SubscriptionPayment payment = paymentRepository
                .findByPaymentMemo(matcher.group().toUpperCase(Locale.ROOT))
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy giao dịch đăng ký"));
        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            return Map.of("success", true, "subscriptionId", payment.getSubscription().getSubscriptionId(),
                    "message", "Giao dịch đã được xử lý trước đó");
        }
        if (payment.getStatus() != PaymentStatus.PENDING) {
            throw new AppException(ErrorCode.INVALID_STATE_TRANSITION, "Yêu cầu thanh toán này không còn hiệu lực");
        }
        if (amount.compareTo(payment.getAmount()) < 0) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Số tiền nhận được chưa đủ để kích hoạt gói");
        }
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setPaidAt(LocalDateTime.now());
        payment.setTransactionReference(reference);
        paymentRepository.save(payment);
        SpaSubscription activated = activate(payment.getSubscription());
        log.info("Activated subscription {} from bank webhook", activated.getSubscriptionId());
        return Map.of("success", true, "subscriptionId", activated.getSubscriptionId(), "message", "Đã kích hoạt gói dịch vụ");
    }

    private SpaSubscription activate(SpaSubscription subscription) {
        subscriptionRepository.findFirstByOwnerUserIdAndStatusInOrderByCreatedAtDesc(subscription.getOwner().getUserId(), CURRENT_STATUSES)
                .ifPresent(old -> {
                    if (!old.getSubscriptionId().equals(subscription.getSubscriptionId())) {
                        old.setStatus(SubscriptionStatus.SUPERSEDED);
                        old.setAutoRenew(false);
                        old.setCancelledAt(LocalDateTime.now());
                        subscriptionRepository.save(old);
                    }
                });
        LocalDateTime now = LocalDateTime.now();
        subscription.setStatus(SubscriptionStatus.ACTIVE);
        subscription.setActivatedAt(now);
        subscription.setCurrentPeriodStart(now);
        subscription.setCurrentPeriodEnd(subscription.getBillingCycle() == BillingCycle.YEARLY ? now.plusYears(1) : now.plusMonths(1));
        return subscriptionRepository.save(subscription);
    }

    private SpaSubscription requireCurrent(String username) {
        User owner = requireUser(username);
        SpaSubscription subscription = subscriptionRepository
                .findFirstByOwnerUserIdAndStatusInOrderByCreatedAtDesc(owner.getUserId(), CURRENT_STATUSES)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Chưa có gói dịch vụ đang hoạt động"));
        expireIfNeeded(subscription);
        if (subscription.getStatus() == SubscriptionStatus.EXPIRED)
            throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Gói dịch vụ đã hết hạn");
        return subscription;
    }

    private void expireIfNeeded(SpaSubscription subscription) {
        if (subscription.getCurrentPeriodEnd() != null && subscription.getCurrentPeriodEnd().isBefore(LocalDateTime.now())) {
            subscription.setStatus(SubscriptionStatus.EXPIRED);
            subscription.setAutoRenew(false);
            subscriptionRepository.save(subscription);
        }
    }

    private User requireUser(String username) {
        return userRepository.findByUserName(username).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private SubscriptionPlanResponse toPlanResponse(SubscriptionPlan plan) {
        List<String> features = plan.getFeatures() == null || plan.getFeatures().isBlank() ? List.of()
                : Arrays.stream(plan.getFeatures().split("\\|")).map(String::trim).filter(v -> !v.isEmpty()).toList();
        return SubscriptionPlanResponse.builder().planId(plan.getPlanId()).code(plan.getCode()).name(plan.getName())
                .description(plan.getDescription()).monthlyPrice(plan.getMonthlyPrice()).yearlyPrice(plan.getYearlyPrice())
                .maxEmployees(plan.getMaxEmployees()).maxAppointmentsPerMonth(plan.getMaxAppointmentsPerMonth())
                .features(features).popular(plan.isPopular()).build();
    }

    private SubscriptionResponse toResponse(SpaSubscription subscription) {
        return SubscriptionResponse.builder().subscriptionId(subscription.getSubscriptionId()).plan(toPlanResponse(subscription.getPlan()))
                .billingCycle(subscription.getBillingCycle()).status(subscription.getStatus())
                .currentPeriodStart(subscription.getCurrentPeriodStart()).currentPeriodEnd(subscription.getCurrentPeriodEnd())
                .autoRenew(subscription.isAutoRenew()).cancelAtPeriodEnd(subscription.isCancelAtPeriodEnd())
                .activatedAt(subscription.getActivatedAt()).cancelledAt(subscription.getCancelledAt())
                .createdAt(subscription.getCreatedAt()).build();
    }

    private SubscriptionPaymentResponse toPaymentResponse(SubscriptionPayment payment) {
        return SubscriptionPaymentResponse.builder().paymentId(payment.getPaymentId())
                .subscriptionId(payment.getSubscription().getSubscriptionId()).planName(payment.getSubscription().getPlan().getName())
                .amount(payment.getAmount()).status(payment.getStatus()).paymentMemo(payment.getPaymentMemo())
                .transactionReference(payment.getTransactionReference()).createdAt(payment.getCreatedAt()).paidAt(payment.getPaidAt()).build();
    }

    private String firstNonBlank(Map<String, Object> payload, String... keys) {
        for (String key : keys) {
            Object value = payload.get(key);
            if (value != null && !String.valueOf(value).isBlank()) return String.valueOf(value);
        }
        return null;
    }

    private BigDecimal readAmount(Map<String, Object> payload) {
        for (String key : List.of("transferAmount", "amount", "creditAmount", "amount_in")) {
            Object value = payload.get(key);
            if (value instanceof Number number) return BigDecimal.valueOf(number.doubleValue());
            if (value instanceof String text) {
                try { return new BigDecimal(text.replace(",", "")); } catch (NumberFormatException ignored) { }
            }
        }
        return null;
    }
}
