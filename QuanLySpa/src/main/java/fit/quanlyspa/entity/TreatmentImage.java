package fit.quanlyspa.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "treatment_images")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TreatmentImage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "image_id", updatable = false)
    String imageId;

    @Column(name = "image_url", nullable = false)
    String imageUrl;

    @Column(name = "image_type", length = 20)
    String imageType; // BEFORE, AFTER, DURING

    @Column(name = "description", length = 200)
    String description;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;

    // ===== Relationships =====

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "record_id", nullable = false)
    TreatmentRecord treatmentRecord;
}
