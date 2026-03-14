package fit.quanlyspa.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;

public interface ServiceRepository extends JpaRepository<Service, Long> {
}
