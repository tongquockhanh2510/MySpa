package fit.quanlyspa.entity;

import fit.quanlyspa.enums.CommissionType;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "commissions", indexes = {
        @Index(name = "idx_commission_employee", columnList = "employee_id")
})
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Commission {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "commission_id", updatable = false)
    String commissionId;

    @Enumerated(EnumType.STRING)
    @Column(name = "commission_type")
    CommissionType commissionType;

    @Column(name = "base_amount")
    double baseAmount; // service/product price

    @Column(name = "commission_rate")
    double commissionRate; // percentage

    @Column(name = "commission_amount")
    double commissionAmount;

    @Column(name = "month")
    int month;

    @Column(name = "year")
    int year;

    @Column(name = "reference_id", length = 100)
    String referenceId; // invoice_id, appointment_id

    @Column(name = "description", length = 300)
    String description;

    @Column(name = "is_paid")
    @Builder.Default
    boolean isPaid = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;

    // ===== Relationships =====

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    Employee employee;
}
