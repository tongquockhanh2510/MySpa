package fit.quanlyspa.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;

import java.time.LocalDateTime;

@Entity
@Inheritance(strategy = InheritanceType.TABLE_PER_CLASS)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PROTECTED)
public abstract class Promotion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "promotion_id")
    String promotionId;

    @Column(name = "name", nullable = false)
    String name;

    @Column(name = "code", unique = true, nullable = false)
    String code;

    @Column(name = "min_order_value")
    BigDecimal minOrderValue;

    @Column(name = "effective")
    LocalDateTime effective;

    @Column(name = "expiration")
    LocalDateTime expiration;

    @Column(name = "quantity")
    Integer quantity;

    @Column(name = "is_active")
    Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "create_at", updatable = false)
    LocalDateTime createAt;

}

