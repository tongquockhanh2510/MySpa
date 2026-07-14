package fit.quanlyspa.dto.response.admin;

import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class UserAdminResponse {
    String userId;
    String userName;
    boolean isActive;
    String employeeId;
    String employeeName;
    List<RoleAdminResponse> roles;
}
