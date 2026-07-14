package fit.quanlyspa.controller;

import fit.quanlyspa.dto.response.ApiResponse;
import fit.quanlyspa.dto.response.admin.PermissionAdminResponse;
import fit.quanlyspa.dto.response.admin.RoleAdminResponse;
import fit.quanlyspa.dto.response.admin.UserAdminResponse;
import fit.quanlyspa.entity.Permission;
import fit.quanlyspa.entity.Role;
import fit.quanlyspa.entity.User;
import fit.quanlyspa.exception.AppException;
import fit.quanlyspa.exception.ErrorCode;
import fit.quanlyspa.repository.PermissionRepository;
import fit.quanlyspa.repository.RoleRepository;
import fit.quanlyspa.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@RestController
@RequiredArgsConstructor
@Tag(name = "Access Control", description = "API quan ly nguoi dung, vai tro va quyen")
public class AccessControlController {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final PasswordEncoder passwordEncoder;

    public record UpdateRolesRequest(List<String> roles) {}
    public record ResetPasswordRequest(String password) {}

    @GetMapping("/users")
    @Operation(summary = "Danh sach nguoi dung")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<UserAdminResponse>>> getUsers() {
        List<UserAdminResponse> users = userRepository.findAll().stream()
                .sorted(Comparator.comparing(User::getUserName, String.CASE_INSENSITIVE_ORDER))
                .map(this::toUserResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @DeleteMapping("/users/{id}")
    @Operation(summary = "Vo hieu hoa nguoi dung")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<ApiResponse<UserAdminResponse>> deactivateUser(@PathVariable String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        user.setActive(false);
        User saved = userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.success(toUserResponse(saved), "Da vo hieu hoa nguoi dung"));
    }

    @PutMapping("/users/{id}/roles")
    @Operation(summary = "Gan vai tro cho nguoi dung")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<ApiResponse<UserAdminResponse>> updateUserRoles(
            @PathVariable String id,
            @RequestBody UpdateRolesRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        if (request.roles() == null || request.roles().isEmpty()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Phải chọn ít nhất một vai trò");
        }

        Set<Role> newRoles = new HashSet<>();
        for (String roleName : request.roles()) {
            Role role = roleRepository.findByName(roleName.trim().toUpperCase(Locale.ROOT));
            if (role == null) {
                throw new AppException(ErrorCode.VALIDATION_ERROR, "Vai trò không tồn tại: " + roleName);
            }
            newRoles.add(role);
        }

        // Khong cho tu bo quyen ADMIN cua tai khoan admin goc de tranh khoa he thong
        boolean wasAdmin = user.getRoles().stream().anyMatch(r -> "ADMIN".equals(r.getName()));
        boolean staysAdmin = newRoles.stream().anyMatch(r -> "ADMIN".equals(r.getName()));
        if ("admin".equalsIgnoreCase(user.getUserName()) && wasAdmin && !staysAdmin) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Không thể gỡ quyền ADMIN của tài khoản admin gốc");
        }

        user.setRoles(newRoles);
        User saved = userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.success(toUserResponse(saved), "Đã cập nhật vai trò"));
    }

    @PutMapping("/users/{id}/reset-password")
    @Operation(summary = "Dat lai mat khau cho nguoi dung")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<ApiResponse<UserAdminResponse>> resetPassword(
            @PathVariable String id,
            @RequestBody ResetPasswordRequest request) {
        if (request.password() == null || request.password().length() < 6) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Mật khẩu phải có ít nhất 6 ký tự");
        }
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        user.setPassword(passwordEncoder.encode(request.password()));
        User saved = userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.success(toUserResponse(saved), "Đã đặt lại mật khẩu"));
    }

    @PutMapping("/users/{id}/activate")
    @Operation(summary = "Kich hoat lai nguoi dung")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<ApiResponse<UserAdminResponse>> activateUser(@PathVariable String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        user.setActive(true);
        User saved = userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.success(toUserResponse(saved), "Đã kích hoạt lại tài khoản"));
    }

    @GetMapping("/roles")
    @Operation(summary = "Danh sach vai tro")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<RoleAdminResponse>>> getRoles() {
        List<RoleAdminResponse> roles = roleRepository.findAll().stream()
                .sorted(Comparator.comparing(Role::getName, String.CASE_INSENSITIVE_ORDER))
                .map(this::toRoleResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(roles));
    }

    @GetMapping("/permissions")
    @Operation(summary = "Danh sach quyen")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<PermissionAdminResponse>>> getPermissions() {
        List<PermissionAdminResponse> permissions = permissionRepository.findAll().stream()
                .sorted(Comparator.comparing(Permission::getName, String.CASE_INSENSITIVE_ORDER))
                .map(this::toPermissionResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(permissions));
    }

    private UserAdminResponse toUserResponse(User user) {
        return UserAdminResponse.builder()
                .userId(user.getUserId())
                .userName(user.getUserName())
                .isActive(user.isActive())
                .employeeId(user.getEmployee() == null ? null : user.getEmployee().getEmployeeId())
                .employeeName(user.getEmployee() == null ? null : user.getEmployee().getName())
                .roles(user.getRoles() == null ? List.of() : user.getRoles().stream()
                        .sorted(Comparator.comparing(Role::getName, String.CASE_INSENSITIVE_ORDER))
                        .map(this::toRoleResponse)
                        .toList())
                .build();
    }

    private RoleAdminResponse toRoleResponse(Role role) {
        return RoleAdminResponse.builder()
                .name(role.getName())
                .description(role.getDescription())
                .permissions(role.getPermissions() == null ? List.of() : role.getPermissions().stream()
                        .sorted(Comparator.comparing(Permission::getName, String.CASE_INSENSITIVE_ORDER))
                        .map(this::toPermissionResponse)
                        .toList())
                .build();
    }

    private PermissionAdminResponse toPermissionResponse(Permission permission) {
        return PermissionAdminResponse.builder()
                .name(permission.getName())
                .description(permission.getDescription())
                .build();
    }
}
