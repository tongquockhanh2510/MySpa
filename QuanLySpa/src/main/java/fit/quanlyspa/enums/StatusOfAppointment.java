package fit.quanlyspa.enums;

public enum StatusOfAppointment {
    PENDING,        // Chờ xác nhận
    CONFIRMED,      // Đã xác nhận
    CHECKED_IN,     // Đã check-in tại spa
    WAITING,        // Đang chờ phòng/nhân viên
    IN_PROGRESS,    // Đang thực hiện
    COMPLETED,      // Hoàn thành
    CANCELLED,      // Đã hủy
    NO_SHOW,        // Không đến
    RESCHEDULED     // Đã dời lịch
}
