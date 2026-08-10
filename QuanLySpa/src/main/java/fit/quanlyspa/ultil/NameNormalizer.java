package fit.quanlyspa.ultil;

/**
 * ISS-014: chuẩn hóa tên riêng — viết hoa chữ cái đầu mỗi từ, gộp khoảng trắng thừa.
 * Hỗ trợ tiếng Việt (dùng Character.toUpperCase để đúng dấu).
 */
public final class NameNormalizer {

    private NameNormalizer() {
    }

    public static String normalize(String raw) {
        if (raw == null) {
            return null;
        }
        String trimmed = raw.trim().replaceAll("\\s+", " ");
        if (trimmed.isEmpty()) {
            return trimmed;
        }
        StringBuilder sb = new StringBuilder(trimmed.length());
        boolean startOfWord = true;
        for (int i = 0; i < trimmed.length(); i++) {
            char c = trimmed.charAt(i);
            if (c == ' ') {
                startOfWord = true;
                sb.append(c);
            } else if (startOfWord) {
                sb.append(Character.toUpperCase(c));
                startOfWord = false;
            } else {
                sb.append(Character.toLowerCase(c));
            }
        }
        return sb.toString();
    }
}
