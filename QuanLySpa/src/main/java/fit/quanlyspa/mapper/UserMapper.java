package fit.quanlyspa.mapper;
import fit.quanlyspa.dto.request.user.UserCreationRequest;
import fit.quanlyspa.dto.response.user.UserResponse;
import fit.quanlyspa.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {
    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "userName", source = "username")
    @Mapping(target = "roles", ignore = true)
    @Mapping(target = "employee", ignore = true)
    User toUser(UserCreationRequest request);

    @Mapping(target = "id", source = "userId")
    @Mapping(target = "username", source = "userName")
    @Mapping(target = "email", source = "employee.email")
    @Mapping(target = "phone", source = "employee.phone")
    @Mapping(target = "firstName", source = "employee.name")
    @Mapping(target = "lastName", constant = "")
    @Mapping(target = "dob", ignore = true)
    @Mapping(target = "image", ignore = true)
    @Mapping(target = "roles", expression = "java(user.getRoles() == null ? null : user.getRoles().stream().map(role -> role.getName()).collect(java.util.stream.Collectors.toSet()))")
    UserResponse toUserResponse(User user);
}
