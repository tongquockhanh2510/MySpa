package fit.quanlyspa.controller;

import fit.quanlyspa.dto.response.ApiResponse;
import fit.quanlyspa.dto.response.catalog.ServiceResponse;
import fit.quanlyspa.entity.Category;
import fit.quanlyspa.entity.Service;
import fit.quanlyspa.repository.ServiceRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/services")
@RequiredArgsConstructor
@Tag(name = "Services", description = "Service management APIs")
public class ServiceController {

    private final ServiceRepository serviceRepository;

    @GetMapping
    @Operation(summary = "List active services")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST', 'THERAPIST')")
    public ResponseEntity<ApiResponse<List<ServiceResponse>>> getAll() {
        List<ServiceResponse> response = serviceRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    private ServiceResponse toResponse(Service service) {
        Category category = service.getCategory();
        return ServiceResponse.builder()
                .serviceId(service.getServiceId())
                .name(service.getName())
                .price(service.getPrice())
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
