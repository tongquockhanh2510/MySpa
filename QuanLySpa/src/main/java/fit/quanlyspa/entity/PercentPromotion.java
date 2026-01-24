package fit.quanlyspa.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "percent_promotion")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PercentPromotion extends Promotion {

    @Column(name = "percent")
    double percent;

    @Column(name = "max_discount")
    double maxDiscount;
}