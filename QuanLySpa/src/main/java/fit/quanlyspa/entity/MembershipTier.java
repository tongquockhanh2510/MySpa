package fit.quanlyspa.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "membership_tiers")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MembershipTier {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "tier_id", updatable = false)
    String tierId;

    @Column(name = "tier_name", unique = true, nullable = false, length = 50)
    String tierName; // BRONZE, SILVER, GOLD, PLATINUM, DIAMOND

    @Column(name = "min_spent", precision = 15, scale = 2, nullable = false)
    BigDecimal minSpent;

    @Column(name = "max_spent", precision = 15, scale = 2)
    BigDecimal maxSpent;

    @Column(name = "points_multiplier")
    @Builder.Default
    double pointsMultiplier = 1.0; // loyalty point earning multiplier

    @Column(name = "discount_percent")
    @Builder.Default
    double discountPercent = 0.0; // automatic discount on services

    @Column(name = "description", length = 300)
    String description;

    @Column(name = "display_order")
    int displayOrder;

    @Column(name = "badge_color", length = 20)
    String badgeColor;
}
