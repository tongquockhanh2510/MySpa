package fit.quanlyspa.configuration;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.reminders")
public class ReminderProperties {
    private boolean enabled = true;
    private String channel = "IN_APP";
    private String providerUrl;
    private String apiKey;
    private long pollMs = 300000;
    private int scanWindowMinutes = 5;
    private String template = "MY SPA nhac lich: {customer}, ban co lich luc {time}. Lien he spa neu can thay doi.";
}
