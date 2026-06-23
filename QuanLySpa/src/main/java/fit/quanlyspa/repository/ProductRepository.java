package fit.quanlyspa.repository;

import fit.quanlyspa.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, String> {
    Optional<Product> findBySku(String sku);
    boolean existsBySku(String sku);

    @Query("SELECT p FROM Product p WHERE " +
           "(:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(p.brand) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:categoryId IS NULL OR p.category.categoryId = :categoryId)")
    Page<Product> searchProducts(@Param("search") String search,
                                  @Param("categoryId") String categoryId,
                                  Pageable pageable);

    @Query("SELECT p FROM Product p JOIN p.inventory i WHERE i.quantityInStock <= i.minStockLevel ORDER BY i.quantityInStock ASC")
    List<Product> findLowStockProducts();
}
