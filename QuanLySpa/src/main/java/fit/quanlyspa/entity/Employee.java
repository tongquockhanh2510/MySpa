package fit.quanlyspa.entity;

import fit.quanlyspa.enums.Gender;
import fit.quanlyspa.enums.StatusOfEmployee;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "employees", indexes = {
        @Index(name = "idx_employee_phone", columnList = "phone"),
        @Index(name = "idx_employee_email", columnList = "email")
})
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "employee_id", updatable = false)
    String employeeId;

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

    @Enumerated(EnumType.STRING)
    @Column(name = "status_of_employee")
    @Builder.Default
    StatusOfEmployee statusOfEmployee = StatusOfEmployee.ACTIVE;

    @Column(name = "position", length = 100)
    String position;

    @Column(name = "specialty", length = 200)
    String specialty;

    @Column(name = "avatar_url")
    String avatarUrl;

    @Column(name = "base_salary")
    double baseSalary;

    @Column(name = "commission_rate")
    @Builder.Default
    double commissionRate = 0.0;

    @Column(name = "hire_date")
    LocalDate hireDate;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    LocalDateTime updatedAt;

    // ===== Relationships =====

    @JsonIgnore
    @OneToOne
    @JoinColumn(name = "user_id")
    User user;

    // Thong tin tai khoan dang nhap (chi doc) de frontend hien thi
    @com.fasterxml.jackson.annotation.JsonProperty("accountUserName")
    public String getAccountUserName() {
        return user == null ? null : user.getUserName();
    }

    @com.fasterxml.jackson.annotation.JsonProperty("accountActive")
    public Boolean getAccountActive() {
        return user == null ? null : user.isActive();
    }

    @com.fasterxml.jackson.annotation.JsonProperty("accountRoles")
    public List<String> getAccountRoles() {
        if (user == null || user.getRoles() == null) return List.of();
        return user.getRoles().stream().map(Role::getName).sorted().toList();
    }

    @JsonIgnore
    @OneToMany(mappedBy = "employee", fetch = FetchType.LAZY)
    @Builder.Default
    Set<Salary> salaries = new HashSet<>();

    @JsonIgnore
    @OneToMany(mappedBy = "employee", fetch = FetchType.LAZY)
    @Builder.Default
    List<AppoinmentDetail> appoinmentDetails = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "employee", fetch = FetchType.LAZY)
    @Builder.Default
    List<Attendance> attendances = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "employee", fetch = FetchType.LAZY)
    @Builder.Default
    List<Schedule> schedules = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "employee", fetch = FetchType.LAZY)
    @Builder.Default
    List<Commission> commissions = new ArrayList<>();
}
