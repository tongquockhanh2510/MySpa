package fit.quanlyspa.controller;

import fit.quanlyspa.dto.request.catalog.ServiceRequest;
import fit.quanlyspa.dto.response.ApiResponse;
import fit.quanlyspa.dto.response.catalog.ServiceResponse;
import fit.quanlyspa.entity.Category;
import fit.quanlyspa.entity.Service;
import fit.quanlyspa.enums.StatusOfService;
import fit.quanlyspa.exception.AppException;
import fit.quanlyspa.exception.ErrorCode;
import fit.quanlyspa.repository.CategoryRepository;
import fit.quanlyspa.repository.ServiceRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/services")
@RequiredArgsConstructor
@Tag(name = "Services", description = "Service management APIs")
public class ServiceController {

    private final ServiceRepository serviceRepository;
    private final CategoryRepository categoryRepository;

    @GetMapping
    @Operation(summary = "List active services")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST', 'THERAPIST')")
    public ResponseEntity<ApiResponse<List<ServiceResponse>>> getAll() {
        List<ServiceResponse> response = serviceRepository.findAll().stream()
                .filter(service -> service.getStatusOfService() != StatusOfService.INACTIVE)
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @Operation(summary = "Create service")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<ServiceResponse>> create(@Valid @RequestBody ServiceRequest request) {
        if (serviceRepository.existsByNameIgnoreCase(request.getName())) {
            throw new AppException(ErrorCode.SERVICE_ALREADY_EXISTS);
        }

        Service service = new Service();
        applyRequest(service, request);
        Service saved = serviceRepository.save(service);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(toResponse(saved), "Them dich vu thanh cong"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update service")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<ServiceResponse>> update(@PathVariable String id, @Valid @RequestBody ServiceRequest request) {
        Service service = serviceRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.SERVICE_NOT_FOUND));
        if (serviceRepository.existsByNameIgnoreCaseAndServiceIdNot(request.getName(), id)) {
            throw new AppException(ErrorCode.SERVICE_ALREADY_EXISTS);
        }

        applyRequest(service, request);
        Service saved = serviceRepository.save(service);
        return ResponseEntity.ok(ApiResponse.success(toResponse(saved), "Cap nhat dich vu thanh cong"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Soft delete service")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        Service service = serviceRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.SERVICE_NOT_FOUND));
        service.setStatusOfService(StatusOfService.INACTIVE);
        serviceRepository.save(service);
        return ResponseEntity.ok(ApiResponse.successNoContent("Da ngung hien thi dich vu"));
    }

    private void applyRequest(Service service, ServiceRequest request) {
        service.setName(request.getName().trim());
        service.setPrice(request.getPrice());
        service.setCostPrice(request.getCostPrice());
        service.setDuration(request.getDuration());
        service.setDescription(request.getDescription());
        service.setImageUrl(request.getImage());
        service.setStatusOfService(request.getStatusOfService() == null ? StatusOfService.ACTIVE : request.getStatusOfService());
        service.setCommissionRate(request.getCommissionRate());
        service.setMinBookingNotice(request.getMinBookingNotice() == null ? 30 : request.getMinBookingNotice());
        service.setMaxDailyBookings(request.getMaxDailyBookings() == null ? 20 : request.getMaxDailyBookings());
        if (request.getCategoryId() != null && !request.getCategoryId().isBlank()) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
            service.setCategory(category);
        } else {
            service.setCategory(null);
        }
    }

    private ServiceResponse toResponse(Service service) {
        Category category = service.getCategory();
        return ServiceResponse.builder()
                .serviceId(service.getServiceId())
                .name(service.getName())
                .price(service.getPrice())
                .costPrice(service.getCostPrice() == null ? 0 : service.getCostPrice())
                .duration(service.getDuration())
                .description(service.getDescription())
                .image(service.getImageUrl())
                .statusOfService(service.getStatusOfService())
                .commissionRate(service.getCommissionRate())
                .minBookingNotice(service.getMinBookingNotice())
                .maxDailyBookings(service.getMaxDailyBookings())
                .categoryId(category != null ? category.getCategoryId() : null)
                .categoryName(category != null ? category.getName() : null)
                .createdAt(service.getCreatedAt())
                .updatedAt(service.getUpdatedAt())
                .build();
    }
}
