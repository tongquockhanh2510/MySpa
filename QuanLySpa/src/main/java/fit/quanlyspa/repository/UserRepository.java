package fit.quanlyspa.repository;

import fit.quanlyspa.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
        User findByUsername(String username);
}
