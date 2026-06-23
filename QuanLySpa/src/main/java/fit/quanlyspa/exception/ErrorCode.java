package fit.quanlyspa.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
@AllArgsConstructor
public enum ErrorCode {

    // ===== System Errors (1000–1099) =====
    UNCATEGORIZED_EXCEPTION(1000, "Lỗi hệ thống không xác định", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(1001, "Khóa không hợp lệ", HttpStatus.BAD_REQUEST),
    VALIDATION_ERROR(1002, "Dữ liệu không hợp lệ", HttpStatus.BAD_REQUEST),
    UNAUTHENTICATED(1003, "Chưa xác thực", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1004, "Không có quyền truy cập", HttpStatus.FORBIDDEN),
    RESOURCE_NOT_FOUND(1005, "Không tìm thấy tài nguyên", HttpStatus.NOT_FOUND),
    DUPLICATE_RESOURCE(1006, "Tài nguyên đã tồn tại", HttpStatus.CONFLICT),
    INVALID_PAGE_REQUEST(1007, "Yêu cầu phân trang không hợp lệ", HttpStatus.BAD_REQUEST),
    OPERATION_NOT_ALLOWED(1008, "Thao tác không được phép", HttpStatus.FORBIDDEN),
    INVALID_STATE_TRANSITION(1009, "Chuyển trạng thái không hợp lệ", HttpStatus.BAD_REQUEST),

    // ===== Auth Errors (1100–1199) =====
    USER_NOT_FOUND(1100, "Không tìm thấy người dùng", HttpStatus.NOT_FOUND),
    INVALID_CREDENTIALS(1101, "Tên đăng nhập hoặc mật khẩu không đúng", HttpStatus.UNAUTHORIZED),
    ACCOUNT_DISABLED(1102, "Tài khoản đã bị vô hiệu hóa", HttpStatus.FORBIDDEN),
    INVALID_TOKEN(1103, "Token không hợp lệ", HttpStatus.UNAUTHORIZED),
    TOKEN_EXPIRED(1104, "Token đã hết hạn", HttpStatus.UNAUTHORIZED),
    TOKEN_BLACKLISTED(1105, "Token đã bị thu hồi", HttpStatus.UNAUTHORIZED),
    REFRESH_TOKEN_INVALID(1106, "Refresh token không hợp lệ", HttpStatus.UNAUTHORIZED),
    USERNAME_ALREADY_EXISTS(1107, "Tên đăng nhập đã tồn tại", HttpStatus.CONFLICT),
    PASSWORD_TOO_WEAK(1108, "Mật khẩu quá yếu", HttpStatus.BAD_REQUEST),
    OLD_PASSWORD_INCORRECT(1109, "Mật khẩu cũ không đúng", HttpStatus.BAD_REQUEST),

    // ===== Customer Errors (1200–1249) =====
    CUSTOMER_NOT_FOUND(1200, "Không tìm thấy khách hàng", HttpStatus.NOT_FOUND),
    CUSTOMER_PHONE_EXISTS(1201, "Số điện thoại khách hàng đã tồn tại", HttpStatus.CONFLICT),
    CUSTOMER_EMAIL_EXISTS(1202, "Email khách hàng đã tồn tại", HttpStatus.CONFLICT),
    CUSTOMER_HAS_ACTIVE_APPOINTMENTS(1203, "Khách hàng đang có lịch hẹn chưa hoàn thành", HttpStatus.BAD_REQUEST),

    // ===== Employee Errors (1250–1299) =====
    EMPLOYEE_NOT_FOUND(1250, "Không tìm thấy nhân viên", HttpStatus.NOT_FOUND),
    EMPLOYEE_PHONE_EXISTS(1251, "Số điện thoại nhân viên đã tồn tại", HttpStatus.CONFLICT),
    EMPLOYEE_EMAIL_EXISTS(1252, "Email nhân viên đã tồn tại", HttpStatus.CONFLICT),
    EMPLOYEE_INACTIVE(1253, "Nhân viên không còn hoạt động", HttpStatus.BAD_REQUEST),
    EMPLOYEE_ALREADY_HAS_USER(1254, "Nhân viên đã được liên kết với tài khoản người dùng", HttpStatus.CONFLICT),
    EMPLOYEE_UNAVAILABLE(1255, "Nhân viên không khả dụng trong khung giờ này", HttpStatus.CONFLICT),

    // ===== Role & Permission Errors (1300–1349) =====
    ROLE_NOT_FOUND(1300, "Không tìm thấy vai trò", HttpStatus.NOT_FOUND),
    ROLE_ALREADY_EXISTS(1301, "Vai trò đã tồn tại", HttpStatus.CONFLICT),
    ROLE_IN_USE(1302, "Vai trò đang được sử dụng, không thể xóa", HttpStatus.BAD_REQUEST),
    PERMISSION_NOT_FOUND(1303, "Không tìm thấy quyền hạn", HttpStatus.NOT_FOUND),
    PERMISSION_ALREADY_EXISTS(1304, "Quyền hạn đã tồn tại", HttpStatus.CONFLICT),

    // ===== Service Errors (1350–1399) =====
    SERVICE_NOT_FOUND(1350, "Không tìm thấy dịch vụ", HttpStatus.NOT_FOUND),
    SERVICE_INACTIVE(1351, "Dịch vụ không còn hoạt động", HttpStatus.BAD_REQUEST),
    SERVICE_ALREADY_EXISTS(1352, "Dịch vụ đã tồn tại", HttpStatus.CONFLICT),
    CATEGORY_NOT_FOUND(1353, "Không tìm thấy danh mục", HttpStatus.NOT_FOUND),
    CATEGORY_ALREADY_EXISTS(1354, "Danh mục đã tồn tại", HttpStatus.CONFLICT),
    CATEGORY_IN_USE(1355, "Danh mục đang được sử dụng, không thể xóa", HttpStatus.BAD_REQUEST),

    // ===== Appointment Errors (1400–1499) =====
    APPOINTMENT_NOT_FOUND(1400, "Không tìm thấy lịch hẹn", HttpStatus.NOT_FOUND),
    APPOINTMENT_TIME_CONFLICT(1401, "Khách hàng đã có lịch hẹn trong khung giờ này", HttpStatus.CONFLICT),
    APPOINTMENT_THERAPIST_CONFLICT(1402, "Nhân viên đã có lịch phục vụ trong khung giờ này", HttpStatus.CONFLICT),
    APPOINTMENT_ROOM_CONFLICT(1403, "Phòng đã được đặt trong khung giờ này", HttpStatus.CONFLICT),
    APPOINTMENT_CANNOT_CANCEL(1404, "Không thể hủy lịch hẹn ở trạng thái này", HttpStatus.BAD_REQUEST),
    APPOINTMENT_CANNOT_CHECKIN(1405, "Lịch hẹn phải ở trạng thái CONFIRMED để check-in", HttpStatus.BAD_REQUEST),
    APPOINTMENT_IN_PAST(1406, "Không thể đặt lịch hẹn trong quá khứ", HttpStatus.BAD_REQUEST),
    APPOINTMENT_TOO_SOON(1407, "Lịch hẹn phải được đặt trước ít nhất 30 phút", HttpStatus.BAD_REQUEST),
    APPOINTMENT_DETAIL_NOT_FOUND(1408, "Không tìm thấy chi tiết lịch hẹn", HttpStatus.NOT_FOUND),
    ROOM_NOT_FOUND(1409, "Không tìm thấy phòng", HttpStatus.NOT_FOUND),
    ROOM_INACTIVE(1410, "Phòng không khả dụng", HttpStatus.BAD_REQUEST),

    // ===== Treatment Package Errors (1500–1549) =====
    PACKAGE_NOT_FOUND(1500, "Không tìm thấy gói liệu trình", HttpStatus.NOT_FOUND),
    PACKAGE_INACTIVE(1501, "Gói liệu trình không còn hoạt động", HttpStatus.BAD_REQUEST),
    CUSTOMER_TREATMENT_NOT_FOUND(1502, "Không tìm thấy liệu trình khách hàng", HttpStatus.NOT_FOUND),
    NO_REMAINING_SESSIONS(1503, "Gói liệu trình không còn buổi sử dụng", HttpStatus.BAD_REQUEST),
    PACKAGE_EXPIRED(1504, "Gói liệu trình đã hết hạn", HttpStatus.BAD_REQUEST),
    PACKAGE_SUSPENDED(1505, "Gói liệu trình đang bị tạm dừng", HttpStatus.BAD_REQUEST),
    PACKAGE_CONVERSION_NOT_FOUND(1506, "Không tìm thấy yêu cầu chuyển đổi", HttpStatus.NOT_FOUND),

    // ===== Treatment Record Errors (1550–1599) =====
    TREATMENT_RECORD_NOT_FOUND(1550, "Không tìm thấy hồ sơ điều trị", HttpStatus.NOT_FOUND),

    // ===== Invoice & Payment Errors (1600–1699) =====
    INVOICE_NOT_FOUND(1600, "Không tìm thấy hóa đơn", HttpStatus.NOT_FOUND),
    INVOICE_ALREADY_PAID(1601, "Hóa đơn đã được thanh toán đầy đủ", HttpStatus.BAD_REQUEST),
    INVOICE_CANCELLED(1602, "Hóa đơn đã bị hủy", HttpStatus.BAD_REQUEST),
    PAYMENT_NOT_FOUND(1603, "Không tìm thấy thanh toán", HttpStatus.NOT_FOUND),
    PAYMENT_AMOUNT_EXCEEDS_REMAINING(1604, "Số tiền thanh toán vượt quá số tiền còn lại", HttpStatus.BAD_REQUEST),
    REFUND_REQUIRES_APPROVAL(1605, "Hoàn tiền yêu cầu phê duyệt từ quản lý", HttpStatus.FORBIDDEN),
    INVOICE_CANNOT_CANCEL(1606, "Không thể hủy hóa đơn ở trạng thái này", HttpStatus.BAD_REQUEST),
    ORDER_NOT_FOUND(1607, "Không tìm thấy đơn hàng", HttpStatus.NOT_FOUND),

    // ===== Product & Inventory Errors (1700–1799) =====
    PRODUCT_NOT_FOUND(1700, "Không tìm thấy sản phẩm", HttpStatus.NOT_FOUND),
    PRODUCT_OUT_OF_STOCK(1701, "Sản phẩm đã hết hàng", HttpStatus.BAD_REQUEST),
    INSUFFICIENT_STOCK(1702, "Số lượng tồn kho không đủ", HttpStatus.BAD_REQUEST),
    STOCK_CANNOT_BE_NEGATIVE(1703, "Tồn kho không thể âm", HttpStatus.BAD_REQUEST),
    INVENTORY_NOT_FOUND(1704, "Không tìm thấy thông tin tồn kho", HttpStatus.NOT_FOUND),
    PRODUCT_SKU_EXISTS(1705, "Mã SKU sản phẩm đã tồn tại", HttpStatus.CONFLICT),

    // ===== Promotion & Voucher Errors (1800–1849) =====
    PROMOTION_NOT_FOUND(1800, "Không tìm thấy khuyến mãi", HttpStatus.NOT_FOUND),
    PROMOTION_EXPIRED(1801, "Chương trình khuyến mãi đã hết hạn", HttpStatus.BAD_REQUEST),
    PROMOTION_NOT_ACTIVE(1802, "Chương trình khuyến mãi chưa bắt đầu hoặc đã hết", HttpStatus.BAD_REQUEST),
    PROMOTION_QUANTITY_EXHAUSTED(1803, "Khuyến mãi đã hết lượt sử dụng", HttpStatus.BAD_REQUEST),
    ORDER_VALUE_BELOW_MINIMUM(1804, "Giá trị đơn hàng chưa đạt mức tối thiểu để áp dụng khuyến mãi", HttpStatus.BAD_REQUEST),
    VOUCHER_NOT_FOUND(1805, "Không tìm thấy voucher", HttpStatus.NOT_FOUND),
    VOUCHER_ALREADY_USED(1806, "Voucher đã được sử dụng", HttpStatus.BAD_REQUEST),
    VOUCHER_EXPIRED(1807, "Voucher đã hết hạn", HttpStatus.BAD_REQUEST),
    VOUCHER_CODE_EXISTS(1808, "Mã voucher đã tồn tại", HttpStatus.CONFLICT),

    // ===== Loyalty & Membership Errors (1850–1899) =====
    INSUFFICIENT_LOYALTY_POINTS(1850, "Điểm tích lũy không đủ để đổi", HttpStatus.BAD_REQUEST),
    MEMBERSHIP_NOT_FOUND(1851, "Không tìm thấy thông tin thành viên", HttpStatus.NOT_FOUND),
    MEMBERSHIP_TIER_NOT_FOUND(1852, "Không tìm thấy hạng thành viên", HttpStatus.NOT_FOUND),

    // ===== HR Errors (1900–1969) =====
    SALARY_NOT_FOUND(1900, "Không tìm thấy bảng lương", HttpStatus.NOT_FOUND),
    SALARY_ALREADY_CALCULATED(1901, "Bảng lương tháng này đã được tính", HttpStatus.CONFLICT),
    ATTENDANCE_NOT_FOUND(1902, "Không tìm thấy chấm công", HttpStatus.NOT_FOUND),
    ALREADY_CHECKED_IN(1903, "Nhân viên đã check-in hôm nay", HttpStatus.CONFLICT),
    NOT_CHECKED_IN(1904, "Nhân viên chưa check-in", HttpStatus.BAD_REQUEST),
    SCHEDULE_NOT_FOUND(1905, "Không tìm thấy lịch làm việc", HttpStatus.NOT_FOUND),
    SCHEDULE_CONFLICT(1906, "Lịch làm việc bị trùng", HttpStatus.CONFLICT),
    COMMISSION_NOT_FOUND(1907, "Không tìm thấy hoa hồng", HttpStatus.NOT_FOUND),

    // ===== Review & Notification Errors (1970–1999) =====
    REVIEW_NOT_FOUND(1970, "Không tìm thấy đánh giá", HttpStatus.NOT_FOUND),
    REVIEW_ALREADY_EXISTS(1971, "Khách hàng đã đánh giá lịch hẹn này", HttpStatus.CONFLICT),
    NOTIFICATION_NOT_FOUND(1972, "Không tìm thấy thông báo", HttpStatus.NOT_FOUND);

    private final int code;
    private final String message;
    private final HttpStatusCode statusCode;
}
