package fit.quanlyspa.controller;

import fit.quanlyspa.dto.response.ApiResponse;
import fit.quanlyspa.dto.response.treatment.CustomerTreatmentResponse;
import fit.quanlyspa.entity.Customer;
import fit.quanlyspa.entity.CustomerTreatment;
import fit.quanlyspa.entity.TreatmentPackage;
import fit.quanlyspa.repository.CustomerTreatmentRepository;
import fit.quanlyspa.repository.TreatmentScheduleRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/customer-treatments")
@RequiredArgsConstructor
@Tag(name = "Customer Treatments", description = "Customer treatment package APIs")
public class CustomerTreatmentController {

    private final CustomerTreatmentRepository customerTreatmentRepository;
    private final TreatmentScheduleRepository treatmentScheduleRepository;

    @GetMapping
    @Operation(summary = "List customer treatment packages")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<List<CustomerTreatmentResponse>>> getAll() {
        List<CustomerTreatmentResponse> response = customerTreatmentRepository.findAllWithDetails().stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/customer/{customerId}")
    @Operation(summary = "List treatment packages by customer")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST', 'THERAPIST')")
    public ResponseEntity<ApiResponse<List<CustomerTreatmentResponse>>> getByCustomer(@PathVariable String customerId) {
        List<CustomerTreatmentResponse> response = customerTreatmentRepository.findByCustomerIdWithDetails(customerId).stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    private CustomerTreatmentResponse toResponse(CustomerTreatment ct) {
        Customer customer = ct.getCustomer();
        TreatmentPackage pack = ct.getTreatmentPackage();
        int total = pack != null ? pack.getTotalSessions() : 0;
        int remaining = ct.getRemainingSessions();
        int consumed = Math.max(0, total - remaining);
        int reserved = customer == null || pack == null ? 0 : Math.toIntExact(
                treatmentScheduleRepository.countReservedByTreatment(
                        customer.getCustomerId(), pack.getTreatmentPackageId()));
        return CustomerTreatmentResponse.builder()
                .customerId(customer != null ? customer.getCustomerId() : null)
                .packageId(pack != null ? pack.getTreatmentPackageId() : null)
                .customerName(customer != null ? customer.getName() : null)
                .customerPhone(customer != null ? customer.getPhone() : null)
                .packageName(pack != null ? pack.getPackageName() : null)
                .totalSessions(total)
                .packagePrice(pack != null ? pack.getPackagePrice() : 0)
                .remainingSessions(remaining)
                .consumedSessions(consumed)
                .reservedSessions(reserved)
                .availableSessions(Math.max(0, remaining - reserved))
                .purchaseDate(ct.getPurchaseDate())
                .expiryDate(ct.getExpiryDate())
                .cancelDate(ct.getCancelDate())
                .cancelReason(ct.getCancelReason())
                .packageConversionId(ct.getPackageConversionId())
                .build();
    }
}
