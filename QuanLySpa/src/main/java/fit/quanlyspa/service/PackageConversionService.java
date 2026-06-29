package fit.quanlyspa.service;

import fit.quanlyspa.dto.request.treatment.PackageConversionRequest;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PackageConversionService {

    private static final int VOUCHER_VALID_DAYS = 90;
    private static final int PACKAGE_VALID_DAYS = 365;

    private final PackageConversionRepository packageConversionRepository;
    private final CustomerTreatmentRepository customerTreatmentRepository;
    private final ProductRepository productRepository;
    private final TreatmentPackageRepository treatmentPackageRepository;
    private final TreatmentScheduleRepository treatmentScheduleRepository;
    private final VoucherRepository voucherRepository;

    @Transactional(readOnly = true)
    public List<PackageConversionResponse> getAll() {
        return packageConversionRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public PackageConversionResponse create(PackageConversionRequest request) {
        CustomerTreatment sourceTreatment = customerTreatmentRepository.findById(new CustomerTreatmentId(request.getCustomerId(), request.getPackageId()))
                .orElseThrow(() -> new AppException(ErrorCode.CUSTOMER_TREATMENT_NOT_FOUND));
        if (sourceTreatment.getRemainingSessions() <= 0) {
            throw new AppException(ErrorCode.NO_REMAINING_SESSIONS);
        }
        if (request.getConversionValue() <= 0) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Gia tri quy doi phai lon hon 0");
        }

        PackageConversion conversion = new PackageConversion();
        conversion.setConversionId("CV-" + UUID.randomUUID());
        conversion.setConversionType(request.getConversionType());
        conversion.setConversionValue(request.getConversionValue());
        conversion.setConversionDate(LocalDate.now());
        conversion.setNote(request.getNote());
        conversion.setTargetProductId(blankToNull(request.getTargetProductId()));
        conversion.setTargetPackageId(blankToNull(request.getTargetPackageId()));

        if (request.getConversionType() == ConversionType.TO_PACKAGE) {
            convertToPackage(sourceTreatment, conversion);
        } else {
            Voucher voucher = createConversionVoucher(sourceTreatment.getCustomer(), conversion);
            conversion.setVoucherCode(voucher.getCode());
        }

        conversion = packageConversionRepository.save(conversion);
        sourceTreatment.setRemainingSessions(0);
        sourceTreatment.setPackageConversion(conversion);
        customerTreatmentRepository.save(sourceTreatment);
        conversion.setCustomerTreatment(sourceTreatment);

        return toResponse(conversion);
    }

    private void convertToPackage(CustomerTreatment sourceTreatment, PackageConversion conversion) {
        String targetPackageId = conversion.getTargetPackageId();
        if (targetPackageId == null) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Can chon goi lieu trinh nhan");
        }
        if (targetPackageId.equals(sourceTreatment.getTreatmentPackage().getTreatmentPackageId())) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Khong the doi sang cung mot goi lieu trinh");
        }

        TreatmentPackage targetPackage = treatmentPackageRepository.findById(targetPackageId)
                .orElseThrow(() -> new AppException(ErrorCode.PACKAGE_NOT_FOUND));
        int convertedSessions = calculateConvertedSessions(conversion.getConversionValue(), targetPackage);
        conversion.setConvertedSessions(convertedSessions);

        Customer customer = sourceTreatment.getCustomer();
        CustomerTreatmentId targetId = new CustomerTreatmentId(customer.getCustomerId(), targetPackage.getTreatmentPackageId());
        CustomerTreatment targetTreatment = customerTreatmentRepository.findById(targetId)
                .orElseGet(() -> {
                    CustomerTreatment created = new CustomerTreatment();
                    created.setId(targetId);
                    created.setCustomer(customer);
                    created.setTreatmentPackage(targetPackage);
                    created.setPurchaseDate(LocalDate.now());
                    created.setRemainingSessions(0);
                    return created;
                });

        LocalDate newExpiry = LocalDate.now().plusDays(PACKAGE_VALID_DAYS);
        if (targetTreatment.getExpiryDate() == null || targetTreatment.getExpiryDate().isBefore(newExpiry)) {
            targetTreatment.setExpiryDate(newExpiry);
        }
        int previousRemainingSessions = targetTreatment.getRemainingSessions();
        targetTreatment.setRemainingSessions(previousRemainingSessions + convertedSessions);
        targetTreatment = customerTreatmentRepository.save(targetTreatment);

        createTreatmentSchedules(targetTreatment, previousRemainingSessions, convertedSessions);
    }

    private Voucher createConversionVoucher(Customer customer, PackageConversion conversion) {
        if (conversion.getConversionType() == ConversionType.TO_PRODUCT) {
            String targetProductId = conversion.getTargetProductId();
            if (targetProductId == null) {
                throw new AppException(ErrorCode.VALIDATION_ERROR, "Can chon san pham nhan");
            }
            Product product = productRepository.findById(targetProductId)
                    .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
            if (!product.isActive()) {
                throw new AppException(ErrorCode.VALIDATION_ERROR, "San pham khong con hoat dong");
            }
        }

        String code = "CV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Voucher voucher = Voucher.builder()
                .code(code)
                .voucherType("AMOUNT")
                .discountValue(BigDecimal.valueOf(conversion.getConversionValue()))
                .minOrderValue(BigDecimal.ZERO)
                .expiryDate(LocalDateTime.now().plusDays(VOUCHER_VALID_DAYS))
                .customer(customer)
                .note("Quy doi lieu trinh " + conversion.getConversionId())
                .build();
        return voucherRepository.save(voucher);
    }

    private int calculateConvertedSessions(double conversionValue, TreatmentPackage targetPackage) {
        if (targetPackage.getTotalSessions() <= 0 || targetPackage.getPackagePrice() <= 0) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Goi lieu trinh nhan khong hop le");
        }
        double perSessionValue = targetPackage.getPackagePrice() / targetPackage.getTotalSessions();
        int sessions = (int) Math.floor(conversionValue / perSessionValue);
        sessions = Math.max(1, sessions);
        return Math.min(targetPackage.getTotalSessions(), sessions);
    }

    private void createTreatmentSchedules(CustomerTreatment treatment, int previousRemainingSessions, int addedSessions) {
        for (int i = 1; i <= addedSessions; i++) {
            TreatmentSchedule schedule = TreatmentSchedule.builder()
                    .customerTreatment(treatment)
                    .sessionNumber(previousRemainingSessions + i)
                    .scheduledDate(LocalDate.now().plusWeeks(i))
                    .status(TreatmentScheduleStatus.SCHEDULED)
                    .build();
            treatmentScheduleRepository.save(schedule);
        }
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
                .convertedSessions(conversion.getConvertedSessions())
                .build();
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
