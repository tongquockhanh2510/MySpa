package fit.quanlyspa.controller;

import fit.quanlyspa.dto.request.treatment.PackageConversionRequest;
import fit.quanlyspa.dto.response.ApiResponse;
import fit.quanlyspa.dto.response.treatment.PackageConversionResponse;
import fit.quanlyspa.entity.Customer;
import fit.quanlyspa.entity.CustomerTreatment;
import fit.quanlyspa.entity.CustomerTreatmentId;
import fit.quanlyspa.entity.PackageConversion;
import fit.quanlyspa.entity.TreatmentPackage;
import fit.quanlyspa.exception.AppException;
import fit.quanlyspa.exception.ErrorCode;
import fit.quanlyspa.repository.CustomerTreatmentRepository;
import fit.quanlyspa.repository.PackageConversionRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/package-conversions")
@RequiredArgsConstructor
@Tag(name = "Package Conversions", description = "Treatment package conversion APIs")
public class PackageConversionController {

    private final PackageConversionRepository packageConversionRepository;
    private final CustomerTreatmentRepository customerTreatmentRepository;

    @GetMapping
    @Operation(summary = "List package conversions")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<List<PackageConversionResponse>>> getAll() {
        List<PackageConversionResponse> response = packageConversionRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @Transactional
    @Operation(summary = "Convert remaining treatment sessions")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<PackageConversionResponse>> create(@Valid @RequestBody PackageConversionRequest request) {
        CustomerTreatment treatment = customerTreatmentRepository.findById(new CustomerTreatmentId(request.getCustomerId(), request.getPackageId()))
                .orElseThrow(() -> new AppException(ErrorCode.CUSTOMER_TREATMENT_NOT_FOUND));
        if (treatment.getRemainingSessions() <= 0) {
            throw new AppException(ErrorCode.NO_REMAINING_SESSIONS);
        }

        PackageConversion conversion = new PackageConversion();
        conversion.setConversionId("CV-" + UUID.randomUUID());
        conversion.setConversionType(request.getConversionType());
        conversion.setConversionValue(request.getConversionValue());
        conversion.setConversionDate(LocalDate.now());
        conversion.setNote(request.getNote());
        conversion.setTargetProductId(request.getTargetProductId());
        conversion.setTargetPackageId(request.getTargetPackageId());
        conversion = packageConversionRepository.save(conversion);

        treatment.setRemainingSessions(0);
        treatment.setPackageConversion(conversion);
        customerTreatmentRepository.save(treatment);
        conversion.setCustomerTreatment(treatment);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(toResponse(conversion), "Chuyen doi lieu trinh thanh cong"));
    }

    private PackageConversionResponse toResponse(PackageConversion conversion) {
        CustomerTreatment treatment = conversion.getCustomerTreatment();
        Customer customer = treatment != null ? treatment.getCustomer() : null;
        TreatmentPackage pack = treatment != null ? treatment.getTreatmentPackage() : null;
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
                .build();
    }
}
