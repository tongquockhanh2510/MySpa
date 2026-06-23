package fit.quanlyspa.entity;

import fit.quanlyspa.enums.TreatmentStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "treatment_records")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TreatmentRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "record_id", updatable = false)
    String recordId;

    @Column(name = "session_number")
    int sessionNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    @Builder.Default
    TreatmentStatus status = TreatmentStatus.IN_PROGRESS;

    @Column(name = "pre_treatment_notes", columnDefinition = "TEXT")
    String preTreatmentNotes;

    @Column(name = "treatment_notes", columnDefinition = "TEXT")
    String treatmentNotes;

    @Column(name = "post_treatment_notes", columnDefinition = "TEXT")
    String postTreatmentNotes;

    @Column(name = "skin_condition", length = 200)
    String skinCondition;

    @Column(name = "products_used", columnDefinition = "TEXT")
    String productsUsed;

    @Column(name = "next_appointment_recommendation", columnDefinition = "TEXT")
    String nextAppointmentRecommendation;

    @Column(name = "started_at")
    LocalDateTime startedAt;

    @Column(name = "completed_at")
    LocalDateTime completedAt;

    @Column(name = "created_by", length = 100)
    String createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;

    // FK columns — owners for the composite join to AppoinmentDetail
    @Column(name = "appointment_id")
    String appointmentId;

    @Column(name = "service_id")
    String serviceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumns({
            @JoinColumn(name = "appointment_id", referencedColumnName = "appointment_id", insertable = false, updatable = false),
            @JoinColumn(name = "service_id", referencedColumnName = "service_id", insertable = false, updatable = false),
            @JoinColumn(name = "employee_id", referencedColumnName = "employee_id", insertable = false, updatable = false)
    })
    AppoinmentDetail appointmentDetail;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id")
    Employee employee;

    @OneToMany(mappedBy = "treatmentRecord", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    List<TreatmentImage> images = new ArrayList<>();
}
