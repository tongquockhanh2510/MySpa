package fit.quanlyspa.repository;

import fit.quanlyspa.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepository extends JpaRepository<Role, Long> {
     Role findByName(String name);
}
