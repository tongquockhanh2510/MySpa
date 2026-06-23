package fit.quanlyspa.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "schedules", indexes = {
        @Index(name = "idx_schedule_employee_date", columnList = "employee_id, work_date")
})
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Schedule {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "schedule_id", updatable = false)
    String scheduleId;

    @Column(name = "work_date", nullable = false)
    LocalDate workDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "day_of_week")
    DayOfWeek dayOfWeek;

    @Column(name = "start_time", nullable = false)
    LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    LocalTime endTime;

    @Column(name = "is_day_off")
    @Builder.Default
    boolean isDayOff = false;

    @Column(name = "note", length = 200)
    String note;

    @Column(name = "created_by", length = 100)
    String createdBy;

    @Column(name = "created_at")
    LocalDateTime createdAt;

    // ===== Relationships =====

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    Employee employee;
}
