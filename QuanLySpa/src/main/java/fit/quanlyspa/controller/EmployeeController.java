package fit.quanlyspa.controller;

import fit.quanlyspa.dto.request.employee.EmployeeAccountRequest;
import fit.quanlyspa.dto.request.employee.EmployeeRequest;
import fit.quanlyspa.dto.response.ApiResponse;
import fit.quanlyspa.entity.Employee;
import fit.quanlyspa.entity.Role;
import fit.quanlyspa.entity.User;
import fit.quanlyspa.enums.StatusOfEmployee;
import fit.quanlyspa.exception.AppException;
import fit.quanlyspa.exception.ErrorCode;
import fit.quanlyspa.repository.EmployeeRepository;
import fit.quanlyspa.repository.RoleRepository;
import fit.quanlyspa.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Locale;
import java.util.Set;

@RestController
@RequestMapping("/employees")
@RequiredArgsConstructor
@Tag(name = "Employees", description = "API quản lý nhân viên")
public class EmployeeController {

    // Cac vai tro chu spa duoc phep cap cho nhan vien (khong cap ADMIN qua API nay)
    private static final Set<String> ASSIGNABLE_ROLES = Set.of("MANAGER", "RECEPTIONIST", "THERAPIST");

    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

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

    @PostMapping("/{id}/account")
    @Operation(summary = "Tạo tài khoản đăng nhập cho nhân viên",
            description = "Chủ spa (ADMIN) cấp tài khoản + vai trò (MANAGER/RECEPTIONIST/THERAPIST) cho nhân viên")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<ApiResponse<Employee>> createAccount(
            @PathVariable String id,
            @Valid @RequestBody EmployeeAccountRequest request) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.EMPLOYEE_NOT_FOUND));
        if (employee.getUser() != null) {
            throw new AppException(ErrorCode.VALIDATION_ERROR,
                    "Nhân viên này đã có tài khoản: " + employee.getUser().getUserName());
        }

        String userName = request.getUserName().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByUserName(userName)) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Tên đăng nhập '" + userName + "' đã tồn tại");
        }

        String roleName = request.getRole().trim().toUpperCase(Locale.ROOT);
        if (!ASSIGNABLE_ROLES.contains(roleName)) {
            throw new AppException(ErrorCode.VALIDATION_ERROR,
                    "Vai trò không hợp lệ. Chỉ được cấp: " + String.join(", ", ASSIGNABLE_ROLES));
        }
        Role role = roleRepository.findByName(roleName);
        if (role == null) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Vai trò " + roleName + " chưa được khởi tạo");
        }

        User user = User.builder()
                .userName(userName)
                .password(passwordEncoder.encode(request.getPassword()))
                .isActive(true)
                .roles(new java.util.HashSet<>(Set.of(role)))
                .build();
        user = userRepository.save(user);

        employee.setUser(user);
        Employee saved = employeeRepository.save(employee);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(saved, "Đã tạo tài khoản " + userName + " cho nhân viên " + employee.getName()));
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
