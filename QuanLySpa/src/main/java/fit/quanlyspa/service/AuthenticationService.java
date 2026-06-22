package fit.quanlyspa.service;

import fit.quanlyspa.dto.request.auth.AuthenticationRequest;
import fit.quanlyspa.dto.response.auth.AuthenticationResponse;
import fit.quanlyspa.entity.User;
import fit.quanlyspa.exception.AppException;
import fit.quanlyspa.exception.ErrorCode;
import fit.quanlyspa.mapper.UserMapper;
import fit.quanlyspa.repository.CustomerRepository;
import fit.quanlyspa.repository.RoleRepository;
import fit.quanlyspa.repository.UserRepository;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.ObjectMapper;

@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)

public class AuthenticationService {
    UserRepository userRepository;
    CustomerRepository customerRepository;
    RoleRepository roleRepository;
    @NonFinal
    @Value("${jwt.signer-key}")
    protected String SIGNER_KEY;
    PasswordEncoder passwordEncoder;
    RedisTokenService redisTokenService;
    UserMapper userMapper;
    RestClient.Builder restClientBuilder;

    final ObjectMapper objectMapper = new ObjectMapper();
    public AuthenticationResponse authenticate(AuthenticationRequest request, HttpServletResponse response){
        User user = userRepository.findByUserName(request.getUsername())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
      return null;
    }

}
