package fit.quanlyspa.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "user")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "user_id", updatable = false)
    String userId;

    @Column(name = "user_name", unique = true, nullable = false, length = 100)
    String userName;

    @Column(name = "password", nullable = false)
    String password;

    @Column(name = "is_active")
    @Builder.Default
    boolean isActive = true;

    @Column(name = "last_login_at")
    java.time.LocalDateTime lastLoginAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    java.time.LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    java.time.LocalDateTime updatedAt;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_name")
    )
    @Builder.Default
    Set<Role> roles = new HashSet<>();

    @OneToOne(mappedBy = "user")
    Employee employee;
}
