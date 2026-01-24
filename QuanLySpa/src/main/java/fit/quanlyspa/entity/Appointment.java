package fit.quanlyspa.entity;

import fit.quanlyspa.enums.StatusOfAppointment;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "appointments")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Appointment {
    @Id
    @Column(name = "appointment_id")
    String appointmentId;
    @Column(name = "status_of_appointment")
    StatusOfAppointment statusOfAppointment;

    @Column(name = "date_time")
    LocalDateTime dateTime;
    String note;
    @ManyToOne
    @JoinColumn(name = "customer_id")
    Customer customer;

}
