package fit.quanlyspa.entity;

import fit.quanlyspa.enums.StatusOfService;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "services")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Service {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "service_id", updatable = false)
    String serviceId;

    @Column(name = "display_code", unique = true, length = 30)
    String displayCode;

    @Column(name = "name", nullable = false, length = 200)
    String name;

    @Column(name = "price", nullable = false)
    double price;

    // Wrapper type vi cac dich vu cu (truoc khi them cot) mang gia tri NULL trong DB
    @Column(name = "cost_price")
    @Builder.Default
    Double costPrice = 0.0; // tien von (chi phi nguyen lieu, vat tu) cho 1 lan thuc hien

    @Column(name = "duration", nullable = false)
    double duration; // in minutes

    @Column(name = "description", columnDefinition = "TEXT")
    String description;

    @Column(name = "image_url")
    String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_of_service")
    @Builder.Default
    StatusOfService statusOfService = StatusOfService.ACTIVE;

    @Column(name = "commission_rate")
    @Builder.Default
    double commissionRate = 0.0;

    @Column(name = "min_booking_notice")
    @Builder.Default
    int minBookingNotice = 30; // minutes before appointment

    @Column(name = "max_daily_bookings")
    @Builder.Default
    int maxDailyBookings = 20;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    LocalDateTime updatedAt;

    // ===== Relationships =====

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    Category category;

    @OneToMany(mappedBy = "service", fetch = FetchType.LAZY)
    @Builder.Default
    List<AppoinmentDetail> appoinmentDetails = new ArrayList<>();
}
