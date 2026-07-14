package fit.quanlyspa.ultil;

import fit.quanlyspa.enums.StatusOfPakage;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class StatusOfPakageConverter implements AttributeConverter<StatusOfPakage, String> {

    @Override
    public String convertToDatabaseColumn(StatusOfPakage status) {
        return status == null ? null : status.name();
    }

    @Override
    public StatusOfPakage convertToEntityAttribute(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String normalizedValue = value.trim();
        return switch (normalizedValue) {
            case "0" -> StatusOfPakage.NOT_STARTED;
            case "1" -> StatusOfPakage.IN_PROGRESS;
            case "2" -> StatusOfPakage.COMPLETED;
            default -> StatusOfPakage.valueOf(normalizedValue);
        };
    }
}
