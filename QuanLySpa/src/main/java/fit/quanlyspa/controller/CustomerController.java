package fit.quanlyspa.controller;

import fit.quanlyspa.dto.request.customer.CustomerRequest;
import fit.quanlyspa.dto.response.ApiResponse;
import fit.quanlyspa.dto.response.PagedResponse;
import fit.quanlyspa.dto.response.customer.CustomerResponse;
import fit.quanlyspa.service.CustomerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/customers")
@RequiredArgsConstructor
@Tag(name = "Customers", description = "API quản lý khách hàng")
public class CustomerController {

    private final CustomerService customerService;

    @GetMapping
    @Operation(summary = "Danh sách khách hàng")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<PagedResponse<CustomerResponse>>> getAll(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        Sort sort = direction.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        PagedResponse<CustomerResponse> result = customerService.getAll(search, PageRequest.of(page, size, sort));
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết khách hàng")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST', 'THERAPIST')")
    public ResponseEntity<ApiResponse<CustomerResponse>> getById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(customerService.getById(id)));
    }

    @PostMapping
    @Operation(summary = "Thêm khách hàng mới")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<CustomerResponse>> create(@Valid @RequestBody CustomerRequest request) {
        CustomerResponse response = customerService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response, "Thêm khách hàng thành công"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật khách hàng")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<CustomerResponse>> update(
            @PathVariable String id,
            @Valid @RequestBody CustomerRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(customerService.update(id, request), "Cập nhật thành công"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa khách hàng")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        customerService.delete(id);
        return ResponseEntity.ok(ApiResponse.successNoContent("Xóa khách hàng thành công"));
    }
}
