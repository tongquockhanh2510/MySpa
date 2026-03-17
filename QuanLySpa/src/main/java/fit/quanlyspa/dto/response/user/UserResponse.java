package fit.quanlyspa.dto.response.user;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.util.Set;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserResponse {
    String id; // userId
    String username;
    String email;
    String phone;
    String firstName;
    String lastName;
    LocalDate dob;
    String image;
    Set<String> roles;
}