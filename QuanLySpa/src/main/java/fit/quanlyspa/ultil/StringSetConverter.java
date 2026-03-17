package fit.quanlyspa.ultil;


import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Converter
public class StringSetConverter implements AttributeConverter<Set<String>, String> {

    private static final String DELIMITER = "|"; // Dấu phân cách

    @Override
    public String convertToDatabaseColumn(Set<String> stringSet) {
        if (stringSet == null || stringSet.isEmpty()) {
            return null;
        }
        return stringSet.stream()
                .filter(str -> str != null && !str.trim().isEmpty())
                .collect(Collectors.joining(DELIMITER));
    }

    @Override
    public Set<String> convertToEntityAttribute(String string) {
        if (string == null || string.trim().isEmpty()) {
            return new HashSet<>();
        }
        return Stream.of(string.split("\\" + DELIMITER))
                .filter(s -> !s.trim().isEmpty())
                .collect(Collectors.toSet());
    }
}

