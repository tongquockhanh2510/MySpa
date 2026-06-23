package fit.quanlyspa.controller;

import fit.quanlyspa.dto.response.ApiResponse;
import fit.quanlyspa.entity.CustomerTreatment;
import fit.quanlyspa.repository.CustomerTreatmentRepository;
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
@Tag(name = "Customer Treatments", description = "API quản lý số buổi và gói liệu trình đã mua của khách hàng")
public class CustomerTreatmentController {

    private final CustomerTreatmentRepository customerTreatmentRepository;

    @GetMapping
    @Operation(summary = "Danh sách tất cả gói liệu trình đang hoạt động")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<List<CustomerTreatment>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(customerTreatmentRepository.findAll()));
    }

    @GetMapping("/customer/{customerId}")
    @Operation(summary = "Danh sách gói liệu trình của khách hàng cụ thể")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST', 'THERAPIST')")
    public ResponseEntity<ApiResponse<List<CustomerTreatment>>> getByCustomer(@PathVariable String customerId) {
        return ResponseEntity.ok(ApiResponse.success(customerTreatmentRepository.findByCustomer_CustomerId(customerId)));
    }
}
