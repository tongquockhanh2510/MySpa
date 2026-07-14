package fit.quanlyspa.dto.response.appointment;

import fit.quanlyspa.enums.StatusOfAppointment;
import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;
import java.util.List;

@Value
@Builder
public class AppointmentResponse {
    String appointmentId;
    String displayCode;
    StatusOfAppointment statusOfAppointment;
    LocalDateTime dateTime;
    LocalDateTime endTime;
    String note;
    String cancelReason;
    LocalDateTime cancelledAt;
    String customerId;
    String customerDisplayCode;
    String customerName;
    String customerPhone;
    String roomId;
    String roomName;
    List<AppointmentDetailResponse> details;

    @Value
    @Builder
    public static class AppointmentDetailResponse {
        String appointmentId;
        String serviceId;
        String employeeId;
        String serviceName;
        String employeeName;
        double price;
    }
}
