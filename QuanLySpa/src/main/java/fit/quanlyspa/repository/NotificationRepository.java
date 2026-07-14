package fit.quanlyspa.repository;

import fit.quanlyspa.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, String> {

    Page<Notification> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Notification> findByIsReadFalseOrderByCreatedAtDesc(Pageable pageable);

    long countByIsReadFalse();

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :now WHERE n.isRead = false")
    int markAllRead(LocalDateTime now);
}
