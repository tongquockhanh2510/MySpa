package fit.quanlyspa.entity;

import fit.quanlyspa.enums.TreatmentScheduleStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "treatment_schedules")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TreatmentSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "schedule_id", updatable = false)
    String scheduleId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumns({
            @JoinColumn(name = "customer_id", referencedColumnName = "customer_id"),
            @JoinColumn(name = "package_id", referencedColumnName = "package_id")
    })
    CustomerTreatment customerTreatment;

    @Column(name = "session_number", nullable = false)
    int sessionNumber;

    @Column(name = "scheduled_date", nullable = false)
    LocalDate scheduledDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "therapist_id")
    Employee therapist;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    Room room;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20, columnDefinition = "VARCHAR(20)")
    @Builder.Default
    TreatmentScheduleStatus status = TreatmentScheduleStatus.SCHEDULED;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;
}
