package fit.quanlyspa.dto.request.catalog;

import fit.quanlyspa.enums.CategoryType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CategoryRequest {
    @NotBlank(message = "Ten danh muc khong duoc de trong")
    @Size(max = 120, message = "Ten danh muc khong duoc vuot qua 120 ky tu")
    String name;

    @jakarta.validation.constraints.NotNull(message = "Loai danh muc khong duoc de trong")
    CategoryType type;
}
