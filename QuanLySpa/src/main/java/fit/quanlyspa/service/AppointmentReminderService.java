package fit.quanlyspa.service;

import fit.quanlyspa.configuration.ReminderProperties;
import fit.quanlyspa.dto.response.appointment.AppointmentReminderLogResponse;
import fit.quanlyspa.entity.Appointment;
import fit.quanlyspa.entity.AppointmentReminderLog;
import fit.quanlyspa.enums.NotificationType;
import fit.quanlyspa.repository.AppointmentReminderLogRepository;
import fit.quanlyspa.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
@Slf4j
@RequiredArgsConstructor
public class AppointmentReminderService {
    private static final Set<String> SUPPORTED_CHANNELS = Set.of("IN_APP", "SMS", "ZALO");
    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy");

    private final AppointmentRepository appointmentRepository;
    private final AppointmentReminderLogRepository reminderLogRepository;
    private final NotificationService notificationService;
    private final ReminderProperties properties;

    @Scheduled(fixedDelayString = "${app.reminders.poll-ms:300000}")
    public void scheduledRun() {
        if (properties.isEnabled()) {
            runDueReminders();
        }
    }

    public int runDueReminders() {
        String channel = normalizedChannel();
        int processed = 0;
        for (int leadHours : List.of(24, 2)) {
            LocalDateTime target = LocalDateTime.now().plusHours(leadHours);
            int window = Math.max(properties.getScanWindowMinutes(), 1);
            List<Appointment> appointments = appointmentRepository.findReminderCandidates(
                    target.minusMinutes(window), target.plusMinutes(window));
            for (Appointment appointment : appointments) {
                if (!reminderLogRepository.existsByAppointment_AppointmentIdAndLeadHoursAndChannel(
                        appointment.getAppointmentId(), leadHours, channel)) {
                    sendAndRecord(appointment, leadHours, channel);
                    processed++;
                }
            }
        }
        return processed;
    }

    @Transactional(readOnly = true)
    public List<AppointmentReminderLogResponse> getLogs() {
        return reminderLogRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    private void sendAndRecord(Appointment appointment, int leadHours, String channel) {
        String recipient = appointment.getCustomer().getPhone();
        String message = renderMessage(appointment);
        AppointmentReminderLog entry = AppointmentReminderLog.builder()
                .appointment(appointment)
                .leadHours(leadHours)
                .channel(channel)
                .recipient(recipient)
                .message(message)
                .status("PENDING")
                .build();
        try {
            if ("IN_APP".equals(channel)) {
                boolean sent = notificationService.notify(NotificationType.APPOINTMENT_REMINDER,
                        "Nhắc lịch hẹn", message, appointment.getAppointmentId(), "APPOINTMENT",
                        appointment.getCustomer());
                if (!sent) {
                    throw new IllegalStateException("Khong the ghi thong bao noi bo");
                }
            } else {
                sendToProvider(channel, recipient, message, appointment.getAppointmentId());
            }
            entry.setStatus("SENT");
            entry.setSentAt(LocalDateTime.now());
        } catch (Exception ex) {
            entry.setStatus("FAILED");
            entry.setErrorMessage(trimError(ex.getMessage()));
            log.warn("Gui nhac lich {} qua {} that bai: {}", appointment.getAppointmentId(), channel, ex.getMessage());
        }
        reminderLogRepository.save(entry);
    }

    private void sendToProvider(String channel, String recipient, String message, String appointmentId) {
        if (isBlank(properties.getProviderUrl()) || isBlank(properties.getApiKey())) {
            throw new IllegalStateException("Chua cau hinh REMINDER_PROVIDER_URL va REMINDER_API_KEY");
        }
        RestClient.create().post()
                .uri(properties.getProviderUrl())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + properties.getApiKey())
                .body(Map.of(
                        "channel", channel,
                        "recipient", recipient == null ? "" : recipient,
                        "message", message,
                        "appointmentId", appointmentId))
                .retrieve()
                .toBodilessEntity();
    }

    private String renderMessage(Appointment appointment) {
        return properties.getTemplate()
                .replace("{customer}", appointment.getCustomer().getName())
                .replace("{phone}", appointment.getCustomer().getPhone() == null ? "" : appointment.getCustomer().getPhone())
                .replace("{time}", appointment.getDateTime().format(TIME_FORMAT));
    }

    private String normalizedChannel() {
        String channel = properties.getChannel() == null
                ? "IN_APP"
                : properties.getChannel().trim().toUpperCase(Locale.ROOT);
        return SUPPORTED_CHANNELS.contains(channel) ? channel : "IN_APP";
    }

    private AppointmentReminderLogResponse toResponse(AppointmentReminderLog entry) {
        Appointment appointment = entry.getAppointment();
        return AppointmentReminderLogResponse.builder()
                .reminderLogId(entry.getReminderLogId())
                .appointmentId(appointment.getAppointmentId())
                .customerName(appointment.getCustomer().getName())
                .appointmentTime(appointment.getDateTime())
                .leadHours(entry.getLeadHours())
                .channel(entry.getChannel())
                .status(entry.getStatus())
                .recipient(entry.getRecipient())
                .message(entry.getMessage())
                .errorMessage(entry.getErrorMessage())
                .sentAt(entry.getSentAt())
                .createdAt(entry.getCreatedAt())
                .build();
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String trimError(String value) {
        if (value == null) return "Loi khong xac dinh";
        return value.length() <= 1000 ? value : value.substring(0, 1000);
    }
}
