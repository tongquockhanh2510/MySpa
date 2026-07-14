package fit.quanlyspa.entity;

import fit.quanlyspa.enums.Gender;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "customers", indexes = {
        @Index(name = "idx_customer_phone", columnList = "phone"),
        @Index(name = "idx_customer_email", columnList = "email")
})
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "customer_id", updatable = false)
    String customerId;

    @Column(name = "display_code", unique = true, length = 30)
    String displayCode;

    @Column(name = "name", nullable = false, length = 150)
    String name;

    @Column(name = "phone", unique = true, length = 20)
    String phone;

    @Column(name = "email", unique = true, length = 150)
    String email;

    @Enumerated(EnumType.STRING)
    @Column(name = "gender")
    Gender gender;

    @Column(name = "date_of_birth")
    LocalDate dateOfBirth;

    @Column(name = "address", length = 300)
    String address;

    @Column(name = "skin_type", length = 100)
    String skinType;

    @Column(name = "allergy_info", columnDefinition = "TEXT")
    String allergyInfo;

    @Column(name = "note", columnDefinition = "TEXT")
    String note;

    @Column(name = "loyalty_points")
    @Builder.Default
    double loyaltyPoints = 0;

    @Column(name = "is_active")
    @Builder.Default
    boolean isActive = true;

    @Column(name = "referred_by")
    String referredBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    LocalDateTime updatedAt;

    // ===== Relationships =====

    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    Set<Appointment> appointments = new HashSet<>();

    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    Set<Order> orders = new HashSet<>();

    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    Set<CustomerTreatment> customerTreatments = new HashSet<>();

    @OneToOne(mappedBy = "customer", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    Membership membership;
}
