package fit.quanlyspa.mapper;
import fit.quanlyspa.dto.request.user.UserCreationRequest;
import fit.quanlyspa.dto.response.user.UserResponse;
import fit.quanlyspa.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "active", ignore = true)
    @Mapping(target = "createAt", ignore = true)
    @Mapping(target = "updateAt", ignore = true)
    User toUser(UserCreationRequest request);


    @Mapping(target ="roles" , expression = "java(user.getRoles().stream().map(role -> role.getName()).toList())")
    @Mapping(source = "image", target = "image")
    UserResponse toUserResponse(User user);




}
