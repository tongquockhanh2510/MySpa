package fit.quanlyspa.dto.response.admin;

import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class RoleAdminResponse {
    String name;
    String description;
    List<PermissionAdminResponse> permissions;
}
