package fit.quanlyspa.repository;

import fit.quanlyspa.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByUserName(String userName);
    boolean existsByUserName(String userName);

    @Query("SELECT u FROM User u WHERE " +
           "(:search IS NULL OR LOWER(u.userName) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<User> findAllWithSearch(String search, Pageable pageable);
}
