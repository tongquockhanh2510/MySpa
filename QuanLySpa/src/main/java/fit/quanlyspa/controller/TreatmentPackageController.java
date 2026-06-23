package fit.quanlyspa.controller;

import fit.quanlyspa.dto.response.ApiResponse;
import fit.quanlyspa.entity.TreatmentPackage;
import fit.quanlyspa.repository.TreatmentPackageRepository;
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
@RequestMapping("/treatment-packages")
@RequiredArgsConstructor
@Tag(name = "Treatment Packages", description = "API quản lý gói liệu trình")
public class TreatmentPackageController {

    private final TreatmentPackageRepository treatmentPackageRepository;

    @GetMapping
    @Operation(summary = "Danh sách tất cả gói liệu trình")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST', 'THERAPIST')")
    public ResponseEntity<ApiResponse<List<TreatmentPackage>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(treatmentPackageRepository.findAll()));
    }
}
