package fit.quanlyspa.controller;

import fit.quanlyspa.dto.response.ApiResponse;
import fit.quanlyspa.dto.response.catalog.CategoryResponse;
import fit.quanlyspa.entity.Category;
import fit.quanlyspa.repository.CategoryRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/categories")
@RequiredArgsConstructor
@Tag(name = "Categories", description = "Category management APIs")
public class CategoryController {

    private final CategoryRepository categoryRepository;

    @GetMapping
    @Operation(summary = "List categories")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST', 'THERAPIST')")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getAll() {
        List<CategoryResponse> response = categoryRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    private CategoryResponse toResponse(Category category) {
        return CategoryResponse.builder()
                .categoryId(category.getCategoryId())
                .name(category.getName())
                .productCount(category.getProducts() == null ? 0 : category.getProducts().size())
                .build();
    }
}
