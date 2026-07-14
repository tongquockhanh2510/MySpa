package fit.quanlyspa.service;

import fit.quanlyspa.dto.request.order.OrderItemRequest;
import fit.quanlyspa.dto.request.order.OrderRequest;
import fit.quanlyspa.dto.request.order.PaymentProcessRequest;
import fit.quanlyspa.dto.request.treatment.PackageConversionRequest;
import fit.quanlyspa.dto.response.order.OrderResponse;
import fit.quanlyspa.dto.response.treatment.PackageConversionResponse;
import fit.quanlyspa.entity.Customer;
import fit.quanlyspa.entity.CustomerTreatment;
import fit.quanlyspa.entity.CustomerTreatmentId;
import fit.quanlyspa.entity.PackageConversion;
import fit.quanlyspa.entity.Product;
import fit.quanlyspa.entity.TreatmentPackage;
import fit.quanlyspa.entity.TreatmentSchedule;
import fit.quanlyspa.entity.Voucher;
import fit.quanlyspa.enums.ConversionType;
import fit.quanlyspa.enums.OrderItemType;
import fit.quanlyspa.enums.PaymentMethod;
import fit.quanlyspa.enums.TreatmentScheduleStatus;
import fit.quanlyspa.exception.AppException;
import fit.quanlyspa.exception.ErrorCode;
import fit.quanlyspa.repository.CustomerTreatmentRepository;
import fit.quanlyspa.repository.PackageConversionRepository;
import fit.quanlyspa.repository.ProductRepository;
import fit.quanlyspa.repository.TreatmentPackageRepository;
import fit.quanlyspa.repository.TreatmentScheduleRepository;
import fit.quanlyspa.repository.VoucherRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Quy doi lieu trinh con dang do sang gia tri khac.
 *
 * Cach hoat dong (cac tinh huong thuc te):
 * - Gia tri quy doi = (gia goi / tong so buoi) x so buoi con lai — server tu tinh, khach khong tu nhap.
 * - TO_PRODUCT / TO_PACKAGE: tao "don hang chuyen doi" mua san pham/goi moi, gia tri quy doi duoc
 *   tru thang vao don qua voucher tin dung. Neu don moi dat hon → khach bu them (top-up);
 *   neu re hon → phan du duoc hoan lai bang voucher moi dung cho lan mua sau.
 * - TO_DISCOUNT / TO_SERVICE: chi phat hanh voucher tin dung de dung cho don hang bat ky.
 * - Sau khi quy doi: goi cu ve 0 buoi va cac buoi SCHEDULED con lai bi huy.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class PackageConversionService {

    private static final int VOUCHER_VALID_DAYS = 90;

    private final PackageConversionRepository packageConversionRepository;
    private final CustomerTreatmentRepository customerTreatmentRepository;
    private final ProductRepository productRepository;
    private final TreatmentPackageRepository treatmentPackageRepository;
    private final TreatmentScheduleRepository treatmentScheduleRepository;
    private final VoucherRepository voucherRepository;
    private final OrderService orderService;

    @Transactional(readOnly = true)
    public List<PackageConversionResponse> getAll() {
        return packageConversionRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public PackageConversionResponse create(PackageConversionRequest request) {
        CustomerTreatment sourceTreatment = customerTreatmentRepository
                .findById(new CustomerTreatmentId(request.getCustomerId(), request.getPackageId()))
                .orElseThrow(() -> new AppException(ErrorCode.CUSTOMER_TREATMENT_NOT_FOUND));
        if (sourceTreatment.getRemainingSessions() <= 0) {
            throw new AppException(ErrorCode.NO_REMAINING_SESSIONS);
        }

        TreatmentPackage sourcePackage = sourceTreatment.getTreatmentPackage();
        if (sourcePackage.getTotalSessions() <= 0 || sourcePackage.getPackagePrice() <= 0) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Gói liệu trình gốc không hợp lệ để quy đổi");
        }

        // Gia tri quy doi tinh theo so buoi con lai — khong tin gia tri client gui len
        BigDecimal credit = BigDecimal.valueOf(sourcePackage.getPackagePrice())
                .divide(BigDecimal.valueOf(sourcePackage.getTotalSessions()), 2, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(sourceTreatment.getRemainingSessions()))
                .setScale(0, RoundingMode.HALF_UP);

        Customer customer = sourceTreatment.getCustomer();

        PackageConversion conversion = new PackageConversion();
        conversion.setConversionId("CV-" + UUID.randomUUID());
        conversion.setConversionType(request.getConversionType());
        conversion.setConversionValue(credit.doubleValue());
        conversion.setConversionDate(LocalDate.now());
        conversion.setNote(request.getNote());
        conversion.setTargetProductId(blankToNull(request.getTargetProductId()));
        conversion.setTargetPackageId(blankToNull(request.getTargetPackageId()));

        if (request.getConversionType() == ConversionType.TO_PRODUCT
                || request.getConversionType() == ConversionType.TO_PACKAGE) {
            createConversionOrder(conversion, customer, credit, request);
        } else {
            // TO_DISCOUNT / TO_SERVICE: phat hanh voucher tin dung dung cho don hang sau
            Voucher voucher = createCreditVoucher(customer, credit, conversion.getConversionId());
            conversion.setVoucherCode(voucher.getCode());
        }

        conversion = packageConversionRepository.save(conversion);

        // Dong goi cu: het buoi + huy cac buoi chua thuc hien
        sourceTreatment.setRemainingSessions(0);
        sourceTreatment.setPackageConversion(conversion);
        customerTreatmentRepository.save(sourceTreatment);
        cancelRemainingSchedules(request.getCustomerId(), request.getPackageId());
        conversion.setCustomerTreatment(sourceTreatment);

        return toResponse(conversion);
    }

    private void createConversionOrder(PackageConversion conversion, Customer customer,
                                       BigDecimal credit, PackageConversionRequest request) {
        OrderItemRequest item = new OrderItemRequest();
        if (request.getConversionType() == ConversionType.TO_PRODUCT) {
            String productId = conversion.getTargetProductId();
            if (productId == null) {
                throw new AppException(ErrorCode.VALIDATION_ERROR, "Cần chọn sản phẩm nhận");
            }
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
            if (!product.isActive()) {
                throw new AppException(ErrorCode.VALIDATION_ERROR, "Sản phẩm không còn hoạt động");
            }
            item.setItemType(OrderItemType.PRODUCT);
            item.setProductId(productId);
            item.setQuantity(request.getQuantity() != null && request.getQuantity() > 0 ? request.getQuantity() : 1);
        } else {
            String targetPackageId = conversion.getTargetPackageId();
            if (targetPackageId == null) {
                throw new AppException(ErrorCode.VALIDATION_ERROR, "Cần chọn gói liệu trình nhận");
            }
            if (targetPackageId.equals(request.getPackageId())) {
                throw new AppException(ErrorCode.VALIDATION_ERROR, "Không thể đổi sang cùng một gói liệu trình");
            }
            treatmentPackageRepository.findById(targetPackageId)
                    .orElseThrow(() -> new AppException(ErrorCode.PACKAGE_NOT_FOUND));
            item.setItemType(OrderItemType.PACKAGE);
            item.setPackageId(targetPackageId);
            item.setQuantity(1);
        }

        // Voucher tin dung mang gia tri quy doi, ap thang vao don hang chuyen doi
        Voucher creditVoucher = createCreditVoucher(customer, credit, conversion.getConversionId());
        conversion.setVoucherCode(creditVoucher.getCode());

        OrderRequest orderRequest = OrderRequest.builder()
                .customerId(customer.getCustomerId())
                .items(List.of(item))
                .voucherCode(creditVoucher.getCode())
                .build();

        OrderResponse order = orderService.createOrder(orderRequest, "PACKAGE_CONVERSION");
        conversion.setOrderId(order.getOrderId());
        conversion.setTopUpAmount(order.getTotalAmount().doubleValue());

        // Phan gia tri du chua dung het → hoan lai bang voucher moi
        BigDecimal usedCredit = order.getVoucherDiscount() == null ? BigDecimal.ZERO : order.getVoucherDiscount();
        BigDecimal leftover = credit.subtract(usedCredit);
        if (leftover.compareTo(BigDecimal.ONE) > 0) {
            Voucher leftoverVoucher = createCreditVoucher(customer, leftover, conversion.getConversionId() + "-DU");
            conversion.setLeftoverVoucherCode(leftoverVoucher.getCode());
        }

        // Don da duoc tru het tien (khong can bu) → xac nhan thanh toan 0d de chay luong sau thanh toan
        if (order.getTotalAmount().compareTo(BigDecimal.ZERO) <= 0) {
            PaymentProcessRequest payment = new PaymentProcessRequest();
            payment.setAmount(BigDecimal.ZERO);
            payment.setPaymentMethod(PaymentMethod.CASH);
            payment.setNotes("Thanh toán bằng giá trị quy đổi liệu trình " + conversion.getConversionId());
            orderService.processPayment(order.getOrderId(), payment, "PACKAGE_CONVERSION");
        }

        log.info("Conversion {} created order {} (top-up: {})",
                conversion.getConversionId(), order.getOrderId(), order.getTotalAmount());
    }

    private Voucher createCreditVoucher(Customer customer, BigDecimal value, String reference) {
        String code = "CV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Voucher voucher = Voucher.builder()
                .code(code)
                .voucherType("AMOUNT")
                .discountValue(value)
                .minOrderValue(BigDecimal.ZERO)
                .expiryDate(LocalDateTime.now().plusDays(VOUCHER_VALID_DAYS))
                .customer(customer)
                .note("Quy đổi liệu trình " + reference)
                .build();
        return voucherRepository.save(voucher);
    }

    private void cancelRemainingSchedules(String customerId, String packageId) {
        List<TreatmentSchedule> remaining = treatmentScheduleRepository.findScheduledByTreatment(customerId, packageId);
        for (TreatmentSchedule schedule : remaining) {
            schedule.setStatus(TreatmentScheduleStatus.CANCELLED);
        }
        treatmentScheduleRepository.saveAll(remaining);
    }

    private PackageConversionResponse toResponse(PackageConversion conversion) {
        CustomerTreatment treatment = conversion.getCustomerTreatment();
        Customer customer = treatment != null ? treatment.getCustomer() : null;
        TreatmentPackage pack = treatment != null ? treatment.getTreatmentPackage() : null;
        Product targetProduct = conversion.getTargetProductId() == null
                ? null
                : productRepository.findById(conversion.getTargetProductId()).orElse(null);
        TreatmentPackage targetPackage = conversion.getTargetPackageId() == null
                ? null
                : treatmentPackageRepository.findById(conversion.getTargetPackageId()).orElse(null);

        return PackageConversionResponse.builder()
                .conversionId(conversion.getConversionId())
                .conversionType(conversion.getConversionType())
                .conversionValue(conversion.getConversionValue())
                .conversionDate(conversion.getConversionDate())
                .note(conversion.getNote())
                .customerId(customer != null ? customer.getCustomerId() : null)
                .customerName(customer != null ? customer.getName() : null)
                .packageId(pack != null ? pack.getTreatmentPackageId() : null)
                .packageName(pack != null ? pack.getPackageName() : null)
                .targetProductId(conversion.getTargetProductId())
                .targetProductName(targetProduct != null ? targetProduct.getName() : null)
                .targetPackageId(conversion.getTargetPackageId())
                .targetPackageName(targetPackage != null ? targetPackage.getPackageName() : null)
                .voucherCode(conversion.getVoucherCode())
                .convertedSessions(conversion.getConvertedSessions() == null ? 0 : conversion.getConvertedSessions())
                .orderId(conversion.getOrderId())
                .topUpAmount(conversion.getTopUpAmount())
                .leftoverVoucherCode(conversion.getLeftoverVoucherCode())
                .build();
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
