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
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "memberships")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Membership {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "membership_id", updatable = false)
    String membershipId;

    @Column(name = "total_spent", precision = 15, scale = 2)
    @Builder.Default
    BigDecimal totalSpent = BigDecimal.ZERO;

    @Column(name = "points_balance")
    @Builder.Default
    double pointsBalance = 0;

    @Column(name = "points_earned_total")
    @Builder.Default
    double pointsEarnedTotal = 0;

    @Column(name = "points_redeemed_total")
    @Builder.Default
    double pointsRedeemedTotal = 0;

    @Column(name = "is_active")
    @Builder.Default
    boolean isActive = true;

    @Column(name = "joined_at")
    LocalDateTime joinedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    LocalDateTime updatedAt;

    // ===== Relationships =====

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false, unique = true)
    Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tier_id")
    MembershipTier tier;
}
