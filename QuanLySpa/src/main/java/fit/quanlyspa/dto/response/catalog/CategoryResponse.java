package fit.quanlyspa.dto.response.catalog;

import fit.quanlyspa.enums.CategoryType;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CategoryResponse {
    String categoryId;
    String name;
    CategoryType type;
    int productCount;
    int serviceCount;
}
