package fit.quanlyspa.controller;

import fit.quanlyspa.dto.request.catalog.ProductRequest;
import fit.quanlyspa.dto.response.ApiResponse;
import fit.quanlyspa.dto.response.catalog.ProductResponse;
import fit.quanlyspa.entity.Category;
import fit.quanlyspa.entity.Product;
import fit.quanlyspa.enums.CategoryType;
import fit.quanlyspa.exception.AppException;
import fit.quanlyspa.exception.ErrorCode;
import fit.quanlyspa.repository.CategoryRepository;
import fit.quanlyspa.repository.ProductRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
@Tag(name = "Products", description = "Product management APIs")
public class ProductController {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    @GetMapping
    @Operation(summary = "List active products")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST', 'THERAPIST')")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getAll() {
        List<ProductResponse> response = productRepository.findAll().stream()
                .filter(Product::isActive)
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @Operation(summary = "Create product")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<ProductResponse>> create(@Valid @RequestBody ProductRequest request) {
        Product product = new Product();
        applyRequest(product, request);
        Product saved = productRepository.save(product);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(toResponse(saved), "Them san pham thanh cong"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update product")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<ProductResponse>> update(@PathVariable String id, @Valid @RequestBody ProductRequest request) {
        Product product = productRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
        applyRequest(product, request);
        Product saved = productRepository.save(product);
        return ResponseEntity.ok(ApiResponse.success(toResponse(saved), "Cap nhat san pham thanh cong"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Soft delete product")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        Product product = productRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
        product.setActive(false);
        productRepository.save(product);
        return ResponseEntity.ok(ApiResponse.successNoContent("Da ngung hien thi san pham"));
    }

    @PostMapping(value = "/upload-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload product image")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<String>> uploadImage(@RequestPart("file") MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Vui long chon file anh");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "File upload phai la hinh anh");
        }

        Path productDir = Paths.get(uploadDir, "products").toAbsolutePath().normalize();
        Files.createDirectories(productDir);
        String originalName = StringUtils.cleanPath(file.getOriginalFilename() == null ? "product" : file.getOriginalFilename());
        String extension = "";
        int dotIndex = originalName.lastIndexOf('.');
        if (dotIndex >= 0) {
            extension = originalName.substring(dotIndex);
        }
        String fileName = UUID.randomUUID() + extension;
        Files.copy(file.getInputStream(), productDir.resolve(fileName));
        String imagePath = "/api/v1/uploads/products/" + fileName;
        return ResponseEntity.ok(ApiResponse.success(imagePath, "Upload anh thanh cong"));
    }

    private void applyRequest(Product product, ProductRequest request) {
        product.setName(request.getName());
        product.setSku(request.getSku());
        product.setPrice(request.getPrice());
        product.setCostPrice(request.getCostPrice());
        product.setBrand(request.getBrand());
        product.setStockQuantity(request.getStockQuantity());
        product.setMinStockLevel(request.getMinStockLevel());
        product.setUnit(request.getUnit());
        product.setBarcode(request.getBarcode());
        product.setDescription(request.getDescription());
        product.setImage(request.getImage());
        product.setActive(true);
        if (request.getCategoryId() != null && !request.getCategoryId().isBlank()) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
            if (category.getType() != CategoryType.PRODUCT) {
                throw new AppException(ErrorCode.VALIDATION_ERROR, "Danh muc da chon khong phai danh muc san pham");
            }
            product.setCategory(category);
        } else {
            product.setCategory(null);
        }
    }

    private ProductResponse toResponse(Product product) {
        Category category = product.getCategory();
        return ProductResponse.builder()
                .productId(product.getProductId())
                .name(product.getName())
                .sku(product.getSku())
                .price(product.getPrice())
                .costPrice(product.getCostPrice())
                .brand(product.getBrand())
                .stockQuantity(product.getStockQuantity())
                .minStockLevel(product.getMinStockLevel())
                .unit(product.getUnit())
                .barcode(product.getBarcode())
                .description(product.getDescription())
                .image(product.getImage())
                .active(product.isActive())
                .categoryId(category != null ? category.getCategoryId() : null)
                .categoryName(category != null ? category.getName() : null)
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }
}
