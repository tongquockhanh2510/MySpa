package fit.quanlyspa.dto.response.catalog;

import fit.quanlyspa.enums.StatusOfService;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ServiceResponse {
    String serviceId;
    String displayCode;
    String name;
    double price;
    double costPrice;
    double duration;
    String description;
    String image;
    StatusOfService statusOfService;
    double commissionRate;
    int minBookingNotice;
    int maxDailyBookings;
    String categoryId;
    String categoryName;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
