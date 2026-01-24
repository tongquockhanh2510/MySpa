package fit.quanlyspa.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "appoinment_details")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AppoinmentDetail {

    @EmbeddedId
    AppoimentDetalId id;

    double price;

    @ManyToOne
    @MapsId("appointmentId")
    @JoinColumn(name = "appointment_id")
    Appointment appointment;

    @ManyToOne
    @MapsId("serviceId")
    @JoinColumn(name = "service_id")
    Service service;

    @ManyToOne
    @MapsId("employeeId")
    @JoinColumn(name = "employee_id")
    Employee employee;
    @ManyToOne
    @JoinColumns({
            @JoinColumn(name = "customer_id", referencedColumnName = "customer_id"),
            @JoinColumn(name = "package_id", referencedColumnName = "package_id")
    })
    CustomerTreatment customerTreatment;
}

