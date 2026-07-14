package fit.quanlyspa.service;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class DisplayCodeService {
    private static final DateTimeFormatter DAY_FORMAT = DateTimeFormatter.ofPattern("yyMMdd");
    private final JdbcTemplate jdbcTemplate;

    public String nextCustomerCode() {
        return "KH-" + padded(next("CUSTOMER"), 4);
    }

    public String nextEmployeeCode() {
        return "NV-" + padded(next("EMPLOYEE"), 3);
    }

    public String nextServiceCode(String categoryName) {
        String category = abbreviation(categoryName);
        return "DV-" + category + "-" + padded(next("SERVICE:" + category), 3);
    }

    public String nextOrderCode(LocalDate date) {
        String day = effectiveDate(date).format(DAY_FORMAT);
        return "DH-" + day + "-" + padded(next("ORDER:" + day), 3);
    }

    public String nextAppointmentCode(LocalDate date) {
        String day = effectiveDate(date).format(DAY_FORMAT);
        return "LH-" + day + "-" + padded(next("APPOINTMENT:" + day), 3);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public long next(String key) {
        jdbcTemplate.update("""
                INSERT INTO display_code_sequences (code_key, last_value) VALUES (?, 1)
                ON DUPLICATE KEY UPDATE last_value = last_value + 1
                """, key);
        Long value = jdbcTemplate.queryForObject(
                "SELECT last_value FROM display_code_sequences WHERE code_key = ?", Long.class, key);
        return value == null ? 1 : value;
    }

    private LocalDate effectiveDate(LocalDate date) {
        return date == null ? LocalDate.now() : date;
    }

    private String abbreviation(String value) {
        if (value == null || value.isBlank()) return "KHA";
        String plain = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace('đ', 'd').replace('Đ', 'D')
                .replaceAll("[^A-Za-z0-9]", "")
                .toUpperCase(Locale.ROOT);
        if (plain.isBlank()) return "KHA";
        return plain.substring(0, Math.min(3, plain.length()));
    }

    private String padded(long value, int width) {
        return String.format(Locale.ROOT, "%0" + width + "d", value);
    }
}
