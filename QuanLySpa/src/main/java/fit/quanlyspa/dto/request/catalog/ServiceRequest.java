package fit.quanlyspa.dto.request.catalog;

import fit.quanlyspa.enums.StatusOfService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ServiceRequest {
    @NotBlank(message = "Ten dich vu khong duoc de trong")
    @Size(max = 200, message = "Ten dich vu khong duoc vuot qua 200 ky tu")
    String name;

    @Positive(message = "Gia dich vu phai lon hon 0")
    double price;

    @Min(value = 0, message = "Tien von khong duoc am")
    double costPrice;

    @Positive(message = "Thoi luong dich vu phai lon hon 0")
    double duration;

    @NotBlank(message = "Mo ta dich vu khong duoc de trong")
    String description;

    String image;
    StatusOfService statusOfService;

    @Min(value = 0, message = "Hoa hong phai tu 0 den 100")
    @Max(value = 100, message = "Hoa hong phai tu 0 den 100")
    double commissionRate;

    @Min(value = 0, message = "Thoi gian bao truoc khong duoc am")
    Integer minBookingNotice;

    @Min(value = 1, message = "So luot dat toi da moi ngay phai lon hon 0")
    Integer maxDailyBookings;

    @NotBlank(message = "Vui long chon danh muc dich vu")
    String categoryId;
}
