package fit.quanlyspa.service;

import fit.quanlyspa.entity.*;
import fit.quanlyspa.enums.InvoiceStatus;
import fit.quanlyspa.enums.PaymentMethod;
import fit.quanlyspa.enums.PaymentStatus;
import fit.quanlyspa.exception.AppException;
import fit.quanlyspa.exception.ErrorCode;
import fit.quanlyspa.repository.CustomerRepository;
import fit.quanlyspa.repository.InvoiceRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class InvoiceService {

    InvoiceRepository invoiceRepository;
    CustomerRepository customerRepository;
    CustomerService customerService;

    // ===== CREATE INVOICE =====
    @Transactional
    public Invoice createFromAppointment(String customerId, String appointmentId,
                                          List<InvoiceDetail> details, String createdBy) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new AppException(ErrorCode.CUSTOMER_NOT_FOUND));

        BigDecimal subtotal = details.stream()
                .map(InvoiceDetail::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Invoice invoice = Invoice.builder()
                .invoiceNumber(generateInvoiceNumber())
                .customer(customer)
                .status(InvoiceStatus.DRAFT)
                .subtotal(subtotal)
                .totalAmount(subtotal)
                .remainingAmount(subtotal)
                .createdBy(createdBy)
                .build();

        invoice.setDetails(details);
        final Invoice finalInvoice = invoice;
        details.forEach(d -> d.setInvoice(finalInvoice));

        invoice = invoiceRepository.save(invoice);
        log.info("Invoice created: {} for customer {}", invoice.getInvoiceNumber(), customer.getName());
        return invoice;
    }

    // ===== APPLY PROMOTION =====
    @Transactional
    public Invoice applyPromotion(String invoiceId, Promotion promotion) {
        Invoice invoice = findById(invoiceId);
        validateInvoiceEditable(invoice);

        BigDecimal discount = calculatePromoDiscount(invoice.getSubtotal(), promotion);
        invoice.setPromotion(promotion);
        invoice.setDiscountAmount(discount);
        invoice.setTotalAmount(invoice.getSubtotal().subtract(discount));
        invoice.setRemainingAmount(invoice.getTotalAmount().subtract(invoice.getPaidAmount()));
        return invoiceRepository.save(invoice);
    }

    // ===== APPLY VOUCHER =====
    @Transactional
    public Invoice applyVoucher(String invoiceId, Voucher voucher) {
        Invoice invoice = findById(invoiceId);
        validateInvoiceEditable(invoice);

        // Business Rule: Cannot use already-used voucher
        if (voucher.isUsed()) {
            throw new AppException(ErrorCode.VOUCHER_ALREADY_USED);
        }
        // Business Rule: Cannot use expired voucher
        if (voucher.getExpiryDate() != null && voucher.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new AppException(ErrorCode.VOUCHER_EXPIRED);
        }
        // Business Rule: Min order value
        if (invoice.getTotalAmount().compareTo(voucher.getMinOrderValue()) < 0) {
            throw new AppException(ErrorCode.ORDER_VALUE_BELOW_MINIMUM);
        }

        BigDecimal discount = calculateVoucherDiscount(invoice.getTotalAmount(), voucher);
        invoice.setVoucher(voucher);
        invoice.setDiscountAmount(invoice.getDiscountAmount().add(discount));
        invoice.setTotalAmount(invoice.getSubtotal().subtract(invoice.getDiscountAmount()));
        invoice.setRemainingAmount(invoice.getTotalAmount().subtract(invoice.getPaidAmount()));

        voucher.setUsed(true);
        voucher.setUsedAt(LocalDateTime.now());
        return invoiceRepository.save(invoice);
    }

    // ===== FINALIZE (DRAFT → UNPAID) =====
    @Transactional
    public Invoice finalize(String invoiceId) {
        Invoice invoice = findById(invoiceId);
        if (invoice.getStatus() != InvoiceStatus.DRAFT) {
            throw new AppException(ErrorCode.INVALID_STATE_TRANSITION);
        }
        invoice.setStatus(InvoiceStatus.UNPAID);
        return invoiceRepository.save(invoice);
    }

    // ===== PROCESS PAYMENT =====
    @Transactional
    public Invoice processPayment(String invoiceId, BigDecimal amount, PaymentMethod method,
                                   String transactionRef, String processedBy) {
        Invoice invoice = findById(invoiceId);

        // Business Rule: Cannot pay already fully paid invoice
        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw new AppException(ErrorCode.INVOICE_ALREADY_PAID);
        }
        if (invoice.getStatus() == InvoiceStatus.CANCELLED) {
            throw new AppException(ErrorCode.INVOICE_CANCELLED);
        }
        // Business Rule: Payment amount cannot exceed remaining
        if (amount.compareTo(invoice.getRemainingAmount()) > 0) {
            throw new AppException(ErrorCode.PAYMENT_AMOUNT_EXCEEDS_REMAINING);
        }

        // Create payment record
        BigDecimal change = BigDecimal.ZERO;
        if (method == PaymentMethod.CASH && amount.compareTo(invoice.getRemainingAmount()) > 0) {
            change = amount.subtract(invoice.getRemainingAmount());
            amount = invoice.getRemainingAmount();
        }

        Payment payment = Payment.builder()
                .invoice(invoice)
                .amount(amount)
                .paymentMethod(method)
                .status(PaymentStatus.SUCCESS)
                .transactionReference(transactionRef)
                .changeAmount(change)
                .processedAt(LocalDateTime.now())
                .build();

        invoice.getPayments().add(payment);
        invoice.setPaidAmount(invoice.getPaidAmount().add(amount));
        invoice.setRemainingAmount(invoice.getTotalAmount().subtract(invoice.getPaidAmount()));

        // Update status
        if (invoice.getRemainingAmount().compareTo(BigDecimal.ZERO) <= 0) {
            invoice.setStatus(InvoiceStatus.PAID);
            invoice.setPaidAt(LocalDateTime.now());
            // Earn loyalty points (100,000 VND = 1 point)
            double pointsEarned = invoice.getTotalAmount()
                    .divide(BigDecimal.valueOf(100000), 2, java.math.RoundingMode.DOWN)
                    .doubleValue();
            invoice.setLoyaltyPointsEarned(pointsEarned);
            customerService.addLoyaltyPoints(invoice.getCustomer().getCustomerId(), pointsEarned, "Thanh toán hóa đơn " + invoice.getInvoiceNumber());
        } else {
            invoice.setStatus(InvoiceStatus.PARTIALLY_PAID);
        }

        log.info("Payment processed: {} {} for invoice {}", amount, method, invoice.getInvoiceNumber());
        return invoiceRepository.save(invoice);
    }

    // ===== CANCEL INVOICE =====
    @Transactional
    public Invoice cancel(String invoiceId, String reason) {
        Invoice invoice = findById(invoiceId);

        // Business Rule: Cannot cancel PAID or already CANCELLED invoices
        if (invoice.getStatus() == InvoiceStatus.PAID || invoice.getStatus() == InvoiceStatus.CANCELLED) {
            throw new AppException(ErrorCode.INVOICE_CANNOT_CANCEL);
        }
        if (invoice.getStatus() == InvoiceStatus.PARTIALLY_PAID) {
            // Partially paid requires manager approval (checked at controller level)
            throw new AppException(ErrorCode.REFUND_REQUIRES_APPROVAL);
        }

        invoice.setStatus(InvoiceStatus.CANCELLED);
        invoice.setNote(reason);
        log.info("Invoice {} cancelled: {}", invoiceId, reason);
        return invoiceRepository.save(invoice);
    }

    // ===== READ =====
    public Invoice getById(String id) {
        return findById(id);
    }

    // ===== HELPERS =====
    public Invoice findById(String id) {
        return invoiceRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.INVOICE_NOT_FOUND));
    }

    private void validateInvoiceEditable(Invoice invoice) {
        if (invoice.getStatus() == InvoiceStatus.PAID
            || invoice.getStatus() == InvoiceStatus.CANCELLED
            || invoice.getStatus() == InvoiceStatus.REFUNDED) {
            throw new AppException(ErrorCode.OPERATION_NOT_ALLOWED,
                    "Hóa đơn ở trạng thái " + invoice.getStatus() + " không thể chỉnh sửa");
        }
    }

    private String generateInvoiceNumber() {
        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String seq = String.format("%04d", (int)(Math.random() * 9999) + 1);
        return "INV-" + date + "-" + seq;
    }

    private BigDecimal calculatePromoDiscount(BigDecimal subtotal, Promotion promotion) {
        if (promotion instanceof PercentPromotion pp) {
            BigDecimal discount = subtotal.multiply(BigDecimal.valueOf(pp.getPercent() / 100.0));
            BigDecimal maxDiscount = BigDecimal.valueOf(pp.getMaxDiscount());
            if (maxDiscount.compareTo(BigDecimal.ZERO) > 0 && discount.compareTo(maxDiscount) > 0) {
                return maxDiscount;
            }
            return discount;
        } else if (promotion instanceof AmountPromotion ap) {
            return BigDecimal.valueOf(ap.getDiscount());
        }
        return BigDecimal.ZERO;
    }

    private BigDecimal calculateVoucherDiscount(BigDecimal total, Voucher voucher) {
        if ("PERCENT".equals(voucher.getVoucherType())) {
            BigDecimal discount = total.multiply(voucher.getDiscountValue().divide(BigDecimal.valueOf(100)));
            if (voucher.getMaxDiscount() != null && discount.compareTo(voucher.getMaxDiscount()) > 0) {
                return voucher.getMaxDiscount();
            }
            return discount;
        } else {
            return voucher.getDiscountValue();
        }
    }
}
