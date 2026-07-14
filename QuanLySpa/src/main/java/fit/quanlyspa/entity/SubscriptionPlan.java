package fit.quanlyspa.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "subscription_plans")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SubscriptionPlan {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "plan_id", updatable = false)
    String planId;

    @Column(nullable = false, unique = true, length = 50)
    String code;

    @Column(nullable = false, length = 120)
    String name;

    @Column(length = 500)
    String description;

    @Column(name = "monthly_price", nullable = false, precision = 15, scale = 2)
    BigDecimal monthlyPrice;

    @Column(name = "yearly_price", nullable = false, precision = 15, scale = 2)
    BigDecimal yearlyPrice;

    @Column(name = "max_employees")
    Integer maxEmployees;

    @Column(name = "max_appointments_per_month")
    Integer maxAppointmentsPerMonth;

    @Column(name = "features", length = 1500)
    String features;

    @Builder.Default
    @Column(nullable = false)
    boolean active = true;

    @Builder.Default
    @Column(nullable = false)
    boolean popular = false;

    @Builder.Default
    @Column(name = "sort_order", nullable = false)
    int sortOrder = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    LocalDateTime updatedAt;
}
