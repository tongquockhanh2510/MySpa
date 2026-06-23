package fit.quanlyspa.entity;

import fit.quanlyspa.enums.AttendanceType;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "attendances", indexes = {
        @Index(name = "idx_attendance_employee_date", columnList = "employee_id, work_date")
})
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "attendance_id", updatable = false)
    String attendanceId;

    @Column(name = "work_date", nullable = false)
    LocalDate workDate;

    @Column(name = "check_in_time")
    LocalTime checkInTime;

    @Column(name = "check_out_time")
    LocalTime checkOutTime;

    @Column(name = "working_hours")
    @Builder.Default
    double workingHours = 0;

    @Column(name = "overtime_hours")
    @Builder.Default
    double overtimeHours = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "attendance_type")
    @Builder.Default
    AttendanceType attendanceType = AttendanceType.PRESENT;

    @Column(name = "note", length = 300)
    String note;

    @Column(name = "approved_by", length = 100)
    String approvedBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;

    // ===== Relationships =====

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    Employee employee;
}
