package fit.quanlyspa.entity;

import fit.quanlyspa.enums.BillingCycle;
import fit.quanlyspa.enums.SubscriptionStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "spa_subscriptions", indexes = {
        @Index(name = "idx_subscription_owner_status", columnList = "owner_id,status")
})
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SpaSubscription {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "subscription_id", updatable = false)
    String subscriptionId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    User owner;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "plan_id", nullable = false)
    SubscriptionPlan plan;

    @Enumerated(EnumType.STRING)
    @Column(name = "billing_cycle", nullable = false, length = 20)
    BillingCycle billingCycle;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    SubscriptionStatus status = SubscriptionStatus.PENDING;

    @Column(name = "current_period_start")
    LocalDateTime currentPeriodStart;

    @Column(name = "current_period_end")
    LocalDateTime currentPeriodEnd;

    @Builder.Default
    @Column(name = "auto_renew", nullable = false)
    boolean autoRenew = true;

    @Builder.Default
    @Column(name = "cancel_at_period_end", nullable = false)
    boolean cancelAtPeriodEnd = false;

    @Column(name = "activated_at")
    LocalDateTime activatedAt;

    @Column(name = "cancelled_at")
    LocalDateTime cancelledAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    LocalDateTime updatedAt;
}
