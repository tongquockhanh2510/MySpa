package fit.quanlyspa.controller;

import fit.quanlyspa.dto.request.employee.EmployeeRequest;
import fit.quanlyspa.dto.response.ApiResponse;
import fit.quanlyspa.entity.Employee;
import fit.quanlyspa.enums.StatusOfEmployee;
import fit.quanlyspa.exception.AppException;
import fit.quanlyspa.exception.ErrorCode;
import fit.quanlyspa.repository.EmployeeRepository;
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
@RequestMapping("/employees")
@RequiredArgsConstructor
@Tag(name = "Employees", description = "API quản lý nhân viên")
public class EmployeeController {

    private final EmployeeRepository employeeRepository;

    @GetMapping
    @Operation(summary = "Danh sách tất cả nhân viên")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST', 'THERAPIST')")
    public ResponseEntity<ApiResponse<List<Employee>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(employeeRepository.findAll()));
    }

    @PostMapping
    @Operation(summary = "Them nhan vien moi")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Employee>> create(@Valid @RequestBody EmployeeRequest request) {
        if (employeeRepository.existsByPhone(request.getPhone())) {
            throw new AppException(ErrorCode.EMPLOYEE_PHONE_EXISTS);
        }
        if (employeeRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.EMPLOYEE_EMAIL_EXISTS);
        }

        Employee employee = new Employee();
        applyRequest(employee, request);
        Employee saved = employeeRepository.save(employee);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(saved, "Them nhan vien thanh cong"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cap nhat nhan vien")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Employee>> update(@PathVariable String id, @Valid @RequestBody EmployeeRequest request) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.EMPLOYEE_NOT_FOUND));
        if (employeeRepository.existsByPhoneAndEmployeeIdNot(request.getPhone(), id)) {
            throw new AppException(ErrorCode.EMPLOYEE_PHONE_EXISTS);
        }
        if (employeeRepository.existsByEmailAndEmployeeIdNot(request.getEmail(), id)) {
            throw new AppException(ErrorCode.EMPLOYEE_EMAIL_EXISTS);
        }

        applyRequest(employee, request);
        Employee saved = employeeRepository.save(employee);
        return ResponseEntity.ok(ApiResponse.success(saved, "Cap nhat nhan vien thanh cong"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Danh dau nhan vien nghi viec")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Employee>> delete(@PathVariable String id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.EMPLOYEE_NOT_FOUND));
        employee.setStatusOfEmployee(StatusOfEmployee.INACTIVE);
        Employee saved = employeeRepository.save(employee);
        return ResponseEntity.ok(ApiResponse.success(saved, "Da danh dau nhan vien nghi viec"));
    }

    private void applyRequest(Employee employee, EmployeeRequest request) {
        employee.setName(request.getName().trim());
        employee.setPhone(request.getPhone());
        employee.setEmail(request.getEmail());
        employee.setPosition(request.getPosition());
        employee.setBaseSalary(request.getBaseSalary());
        employee.setStatusOfEmployee(request.getStatusOfEmployee() == null ? StatusOfEmployee.ACTIVE : request.getStatusOfEmployee());
    }
}
