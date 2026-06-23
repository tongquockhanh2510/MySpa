package fit.quanlyspa.dto.response.customer;

import fit.quanlyspa.enums.Gender;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CustomerResponse {
    String customerId;
    String name;
    String phone;
    String email;
    Gender gender;
    LocalDate dateOfBirth;
    String address;
    String skinType;
    String allergyInfo;
    String note;
    double loyaltyPoints;
    boolean isActive;
    String referredBy;
    String membershipTier;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
    int totalAppointments;
    int totalOrders;
}
