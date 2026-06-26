package fit.quanlyspa.controller;

import fit.quanlyspa.dto.request.treatment.TreatmentPackageRequest;
import fit.quanlyspa.dto.response.ApiResponse;
import fit.quanlyspa.dto.response.treatment.TreatmentPackageResponse;
import fit.quanlyspa.entity.Employee;
import fit.quanlyspa.entity.TreatmentPackage;
import fit.quanlyspa.enums.StatusOfPakage;
import fit.quanlyspa.exception.AppException;
import fit.quanlyspa.exception.ErrorCode;
import fit.quanlyspa.repository.EmployeeRepository;
import fit.quanlyspa.repository.TreatmentPackageRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/treatment-packages")
@RequiredArgsConstructor
@Tag(name = "Treatment Packages", description = "Treatment package management APIs")
public class TreatmentPackageController {

    private final TreatmentPackageRepository treatmentPackageRepository;
    private final EmployeeRepository employeeRepository;

    @GetMapping
    @Operation(summary = "List active treatment packages")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST', 'THERAPIST')")
    public ResponseEntity<ApiResponse<List<TreatmentPackageResponse>>> getAll() {
        List<TreatmentPackageResponse> response = treatmentPackageRepository.findAll().stream()
                .filter(pack -> pack.getStatusOfPakage() != StatusOfPakage.INACTIVE)
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @Operation(summary = "Create treatment package")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<TreatmentPackageResponse>> create(@Valid @RequestBody TreatmentPackageRequest request) {
        TreatmentPackage pack = new TreatmentPackage();
        pack.setTreatmentPackageId(resolvePackageId(request));
        applyRequest(pack, request);
        TreatmentPackage saved = treatmentPackageRepository.save(pack);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(toResponse(saved), "Them goi lieu trinh thanh cong"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update treatment package")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<TreatmentPackageResponse>> update(@PathVariable String id, @Valid @RequestBody TreatmentPackageRequest request) {
        TreatmentPackage pack = treatmentPackageRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PACKAGE_NOT_FOUND));
        applyRequest(pack, request);
        TreatmentPackage saved = treatmentPackageRepository.save(pack);
        return ResponseEntity.ok(ApiResponse.success(toResponse(saved), "Cap nhat goi lieu trinh thanh cong"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Soft delete treatment package")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        TreatmentPackage pack = treatmentPackageRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PACKAGE_NOT_FOUND));
        pack.setStatusOfPakage(StatusOfPakage.INACTIVE);
        treatmentPackageRepository.save(pack);
        return ResponseEntity.ok(ApiResponse.successNoContent("Da ngung hien thi goi lieu trinh"));
    }

    private String resolvePackageId(TreatmentPackageRequest request) {
        if (request.getTreatmentPackageId() != null && !request.getTreatmentPackageId().isBlank()) {
            return request.getTreatmentPackageId();
        }
        return "TP-" + UUID.randomUUID();
    }

    private void applyRequest(TreatmentPackage pack, TreatmentPackageRequest request) {
        pack.setPackageName(request.getPackageName());
        pack.setTotalSessions(request.getTotalSessions());
        pack.setPackagePrice(request.getPackagePrice());
        pack.setDescription(request.getDescription());
        pack.setStatusOfPakage(request.getStatusOfPakage() == null ? StatusOfPakage.ACTIVE : request.getStatusOfPakage());
        if (request.getEmployeeId() != null && !request.getEmployeeId().isBlank()) {
            Employee employee = employeeRepository.findById(request.getEmployeeId())
                    .orElseThrow(() -> new AppException(ErrorCode.EMPLOYEE_NOT_FOUND));
            pack.setEmployee(employee);
        } else {
            pack.setEmployee(null);
        }
    }

    private TreatmentPackageResponse toResponse(TreatmentPackage pack) {
        Employee employee = pack.getEmployee();
        return TreatmentPackageResponse.builder()
                .treatmentPackageId(pack.getTreatmentPackageId())
                .packageName(pack.getPackageName())
                .totalSessions(pack.getTotalSessions())
                .packagePrice(pack.getPackagePrice())
                .description(pack.getDescription())
                .statusOfPakage(pack.getStatusOfPakage())
                .employeeId(employee != null ? employee.getEmployeeId() : null)
                .employeeName(employee != null ? employee.getName() : null)
                .build();
    }
}
