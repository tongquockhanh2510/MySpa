package fit.quanlyspa.service;

import fit.quanlyspa.dto.request.auth.ChangePasswordRequest;
import fit.quanlyspa.dto.request.auth.LoginRequest;
import fit.quanlyspa.dto.request.auth.RefreshTokenRequest;
import fit.quanlyspa.dto.response.auth.AuthenticationResponse;
import fit.quanlyspa.entity.User;
import fit.quanlyspa.exception.AppException;
import fit.quanlyspa.exception.ErrorCode;
import fit.quanlyspa.repository.UserRepository;
import fit.quanlyspa.security.JwtTokenProvider;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationService {

    UserRepository userRepository;
    JwtTokenProvider jwtTokenProvider;
    AuthenticationManager authenticationManager;
    UserDetailsService userDetailsService;
    RedisTokenService redisTokenService;
    PasswordEncoder passwordEncoder;

    // ===== LOGIN =====
    @Transactional
    public AuthenticationResponse login(LoginRequest request) {
        log.info("Login attempt for user: {}", request.getUsername());

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            User user = userRepository.findByUserName(request.getUsername())
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

            // Update last login
            user.setLastLoginAt(LocalDateTime.now());
            userRepository.save(user);

            String accessToken = jwtTokenProvider.generateAccessToken(userDetails);
            String refreshToken = jwtTokenProvider.generateRefreshToken(userDetails);

            log.info("Login successful for user: {}", request.getUsername());

            return buildLoginResponse(user, accessToken, refreshToken);

        } catch (BadCredentialsException e) {
            log.warn("Invalid credentials for user: {}", request.getUsername());
            throw new AppException(ErrorCode.INVALID_CREDENTIALS);
        } catch (DisabledException e) {
            log.warn("Disabled account login attempt: {}", request.getUsername());
            throw new AppException(ErrorCode.ACCOUNT_DISABLED);
        }
    }

    // ===== LOGOUT =====
    public void logout(String token) {
        if (token == null || token.isBlank()) return;

        try {
            String jti = jwtTokenProvider.extractJti(token);
            long ttlMs = jwtTokenProvider.getRemainingTtlMs(token);
            if (ttlMs > 0) {
                redisTokenService.blacklistToken(jti, Duration.ofMillis(ttlMs));
                log.info("Token blacklisted: jti={}", jti);
            }
        } catch (Exception e) {
            log.warn("Logout failed to blacklist token: {}", e.getMessage());
        }
    }

    // ===== REFRESH TOKEN =====
    public AuthenticationResponse refreshToken(RefreshTokenRequest request) {
        String refreshToken = request.getRefreshToken();

        if (!jwtTokenProvider.isValidTokenFormat(refreshToken)) {
            throw new AppException(ErrorCode.REFRESH_TOKEN_INVALID);
        }

        String jti = jwtTokenProvider.extractJti(refreshToken);
        if (redisTokenService.isTokenBlacklisted(jti)) {
            throw new AppException(ErrorCode.TOKEN_BLACKLISTED);
        }

        String username = jwtTokenProvider.extractUsername(refreshToken);
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);

        if (!jwtTokenProvider.isTokenValid(refreshToken, userDetails)) {
            throw new AppException(ErrorCode.REFRESH_TOKEN_INVALID);
        }

        User user = userRepository.findByUserName(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        String newAccessToken = jwtTokenProvider.generateAccessToken(userDetails);

        return buildLoginResponse(user, newAccessToken, refreshToken);
    }

    // ===== CHANGE PASSWORD =====
    @Transactional
    public void changePassword(String username, ChangePasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Mật khẩu xác nhận không khớp");
        }

        User user = userRepository.findByUserName(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new AppException(ErrorCode.OLD_PASSWORD_INCORRECT);
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        log.info("Password changed successfully for user: {}", username);
    }

    // ===== Private Helper =====
    private AuthenticationResponse buildLoginResponse(User user, String accessToken, String refreshToken) {
        String employeeId = user.getEmployee() != null ? user.getEmployee().getEmployeeId() : null;
        String employeeName = user.getEmployee() != null ? user.getEmployee().getName() : null;
        String avatarUrl = user.getEmployee() != null ? user.getEmployee().getAvatarUrl() : null;

        return AuthenticationResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(86400)
                .userId(user.getUserId())
                .username(user.getUserName())
                .roles(user.getRoles().stream().map(r -> r.getName()).collect(Collectors.toSet()))
                .employeeId(employeeId)
                .employeeName(employeeName)
                .avatarUrl(avatarUrl)
                .build();
    }
}
