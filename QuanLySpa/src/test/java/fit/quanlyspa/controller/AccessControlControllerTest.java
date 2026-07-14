package fit.quanlyspa.controller;

import fit.quanlyspa.dto.response.admin.UserAdminResponse;
import fit.quanlyspa.entity.Permission;
import fit.quanlyspa.entity.Role;
import fit.quanlyspa.entity.User;
import fit.quanlyspa.exception.AppException;
import fit.quanlyspa.repository.PermissionRepository;
import fit.quanlyspa.repository.RoleRepository;
import fit.quanlyspa.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AccessControlControllerTest {

    @Mock
    UserRepository userRepository;

    @Mock
    RoleRepository roleRepository;

    @Mock
    PermissionRepository permissionRepository;

    @InjectMocks
    AccessControlController controller;

    @Test
    void getUsersReturnsUsersSortedByUsernameWithRoles() {
        Permission permission = permission("MANAGE_USER", "Manage users");
        Role admin = role("ADMIN", "Administrator", Set.of(permission));
        User zeta = user("user-2", "zeta", true, Set.of(admin));
        User alpha = user("user-1", "alpha", true, Set.of(admin));

        when(userRepository.findAll()).thenReturn(List.of(zeta, alpha));

        List<UserAdminResponse> result = controller.getUsers().getBody().getResult();

        assertEquals(List.of("alpha", "zeta"), result.stream().map(UserAdminResponse::getUserName).toList());
        assertEquals("ADMIN", result.get(0).getRoles().getFirst().getName());
        assertEquals("MANAGE_USER", result.get(0).getRoles().getFirst().getPermissions().getFirst().getName());
    }

    @Test
    void deactivateUserMarksUserInactive() {
        User user = user("user-1", "alpha", true, Set.of());
        when(userRepository.findById("user-1")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserAdminResponse result = controller.deactivateUser("user-1").getBody().getResult();

        assertFalse(result.isActive());
        assertFalse(user.isActive());
        verify(userRepository).save(user);
    }

    @Test
    void deactivateUserRejectsMissingUser() {
        when(userRepository.findById("missing")).thenReturn(Optional.empty());

        assertThrows(AppException.class, () -> controller.deactivateUser("missing"));
        verify(userRepository, never()).save(any());
    }

    private static User user(String id, String username, boolean active, Set<Role> roles) {
        User user = User.builder()
                .userId(id)
                .userName(username)
                .password("secret")
                .isActive(active)
                .roles(roles)
                .build();
        return user;
    }

    private static Role role(String name, String description, Set<Permission> permissions) {
        Role role = new Role();
        role.setName(name);
        role.setDescription(description);
        role.setPermissions(permissions);
        return role;
    }

    private static Permission permission(String name, String description) {
        Permission permission = new Permission();
        permission.setName(name);
        permission.setDescription(description);
        return permission;
    }
}
