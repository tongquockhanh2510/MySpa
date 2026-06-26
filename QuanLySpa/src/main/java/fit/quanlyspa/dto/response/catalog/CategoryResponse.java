package fit.quanlyspa.dto.response.catalog;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CategoryResponse {
    String categoryId;
    String name;
    int productCount;
}
