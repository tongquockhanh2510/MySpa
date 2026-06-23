package fit.quanlyspa.controller;

import fit.quanlyspa.dto.request.auth.ChangePasswordRequest;
import fit.quanlyspa.dto.request.auth.LoginRequest;
import fit.quanlyspa.dto.request.auth.RefreshTokenRequest;
import fit.quanlyspa.dto.response.ApiResponse;
import fit.quanlyspa.dto.response.auth.AuthenticationResponse;
import fit.quanlyspa.service.AuthenticationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "API xác thực và phân quyền")
public class AuthController {

    private final AuthenticationService authenticationService;

    @PostMapping("/login")
    @Operation(summary = "Đăng nhập", description = "Xác thực người dùng và trả về JWT token")
    public ResponseEntity<ApiResponse<AuthenticationResponse>> login(
            @Valid @RequestBody LoginRequest request
    ) {
        AuthenticationResponse response = authenticationService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Đăng nhập thành công"));
    }

    @PostMapping("/logout")
    @Operation(summary = "Đăng xuất", description = "Thu hồi access token hiện tại")
    public ResponseEntity<ApiResponse<Void>> logout(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        if (StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
            authenticationService.logout(authHeader.substring(7));
        }
        return ResponseEntity.ok(ApiResponse.successNoContent("Đăng xuất thành công"));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Làm mới token", description = "Dùng refresh token để lấy access token mới")
    public ResponseEntity<ApiResponse<AuthenticationResponse>> refresh(
            @Valid @RequestBody RefreshTokenRequest request
    ) {
        AuthenticationResponse response = authenticationService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Làm mới token thành công"));
    }

    @PostMapping("/change-password")
    @Operation(summary = "Đổi mật khẩu", description = "Đổi mật khẩu cho tài khoản hiện tại")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        authenticationService.changePassword(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.successNoContent("Đổi mật khẩu thành công"));
    }

    @GetMapping("/me")
    @Operation(summary = "Thông tin người dùng", description = "Lấy thông tin tài khoản hiện tại")
    public ResponseEntity<ApiResponse<String>> getCurrentUser(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(ApiResponse.success(userDetails.getUsername()));
    }
}
