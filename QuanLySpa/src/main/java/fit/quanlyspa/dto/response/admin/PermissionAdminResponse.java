package fit.quanlyspa.dto.response.admin;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class PermissionAdminResponse {
    String name;
    String description;
}
