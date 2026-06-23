package fit.quanlyspa.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "treatment_sessions")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TreatmentSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "session_id", updatable = false)
    String sessionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_id", nullable = false)
    TreatmentSchedule treatmentSchedule;

    @Column(name = "session_number", nullable = false)
    int sessionNumber;

    @Column(name = "start_time", nullable = false)
    LocalDateTime startTime;

    @Column(name = "end_time")
    LocalDateTime endTime;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "therapist_id", nullable = false)
    Employee therapist;

    @Column(name = "notes", columnDefinition = "TEXT")
    String notes;

    @Column(name = "before_images", columnDefinition = "TEXT")
    String beforeImages; // Comma separated image paths/URLs

    @Column(name = "after_images", columnDefinition = "TEXT")
    String afterImages;  // Comma separated image paths/URLs

    @Column(name = "result", columnDefinition = "TEXT")
    String result;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;
}
