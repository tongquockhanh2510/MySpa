package fit.quanlyspa.dto.request.user;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.util.Set;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE )
public class UserCreationRequest {
    @Size(min = 3, max = 20, message = "Username must be between 3 and 20 characters")
    String username;
    @Email(message = "Email should be valid")
    String email;
    @Size(min = 6, message = "Password must be at least 6 characters long")
    String password;
    @Pattern(regexp = "^\\+?[0-9]{7,15}$", message = "Phone number must be valid")
    String phone;
    String firstName;
    String lastName;
    @JsonFormat(pattern = "yyyy-MM-dd")
    LocalDate dob;
    String image;
    Set<String> roles;
}
