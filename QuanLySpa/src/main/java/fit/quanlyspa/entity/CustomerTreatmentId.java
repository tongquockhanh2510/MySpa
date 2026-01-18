package fit.quanlyspa.entity;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class CustomerTreatmentId implements Serializable {
    String customerId;
    String packageId;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof CustomerTreatmentId)) return false;
        CustomerTreatmentId that = (CustomerTreatmentId) o;
        return customerId.equals(that.customerId) &&
               packageId.equals(that.packageId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(customerId, packageId);
    }
}
