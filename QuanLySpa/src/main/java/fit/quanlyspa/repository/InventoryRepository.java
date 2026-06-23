package fit.quanlyspa.repository;

import fit.quanlyspa.entity.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, String> {
    Optional<Inventory> findByProduct_ProductId(String productId);

    @Query("SELECT i FROM Inventory i WHERE i.quantityInStock <= i.minStockLevel ORDER BY i.quantityInStock ASC")
    List<Inventory> findLowStock();
}
