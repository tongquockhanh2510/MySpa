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
public class AppoimentDetalId implements Serializable {
    String appointmentId;
    String serviceId;
    String employeeId;


    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof AppoimentDetalId)) return false;
        AppoimentDetalId that = (AppoimentDetalId) o;
        return appointmentId.equals(that.appointmentId) &&
               serviceId.equals(that.serviceId) &&
               employeeId.equals(that.employeeId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(appointmentId, serviceId, employeeId);
    }

}
