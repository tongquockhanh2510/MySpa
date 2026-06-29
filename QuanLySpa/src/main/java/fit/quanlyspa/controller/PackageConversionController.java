package fit.quanlyspa.controller;

import fit.quanlyspa.dto.request.treatment.PackageConversionRequest;
import fit.quanlyspa.dto.response.ApiResponse;
import fit.quanlyspa.dto.response.treatment.PackageConversionResponse;
import fit.quanlyspa.service.PackageConversionService;
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
@RequestMapping("/package-conversions")
@RequiredArgsConstructor
@Tag(name = "Package Conversions", description = "Treatment package conversion APIs")
public class PackageConversionController {

    private final PackageConversionService packageConversionService;

    @GetMapping
    @Operation(summary = "List package conversions")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<List<PackageConversionResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(packageConversionService.getAll()));
    }

    @PostMapping
    @Operation(summary = "Convert remaining treatment sessions")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<PackageConversionResponse>> create(@Valid @RequestBody PackageConversionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(packageConversionService.create(request), "Chuyen doi lieu trinh thanh cong"));
    }
}
