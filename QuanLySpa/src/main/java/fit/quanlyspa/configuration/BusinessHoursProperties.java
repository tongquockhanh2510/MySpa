package fit.quanlyspa.configuration;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.time.LocalTime;

/**
 * Khung giờ mở cửa của spa (ISS-001). Lịch hẹn không được nằm ngoài khung này.
 * Cấu hình qua application.yaml: app.business.opening-time / closing-time.
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.business")
public class BusinessHoursProperties {
    /** Giờ mở cửa, mặc định 08:00. */
    private LocalTime openingTime = LocalTime.of(8, 0);
    /** Giờ đóng cửa, mặc định 21:00. */
    private LocalTime closingTime = LocalTime.of(21, 0);
    /** ISS-025: khoảng nghỉ (phút) giữa 2 lịch của cùng KTV/phòng để dọn dẹp, mặc định 10'. */
    private int bufferMinutes = 10;

    /** true nếu khoảng [start, end] nằm trọn trong khung giờ mở cửa. */
    public boolean isWithinBusinessHours(LocalTime start, LocalTime end) {
        return !start.isBefore(openingTime) && !end.isAfter(closingTime) && !end.isBefore(start);
    }
}
