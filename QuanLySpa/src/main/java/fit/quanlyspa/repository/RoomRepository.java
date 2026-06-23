package fit.quanlyspa.repository;

import fit.quanlyspa.entity.Room;
import fit.quanlyspa.enums.RoomStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoomRepository extends JpaRepository<Room, String> {
    List<Room> findByStatus(RoomStatus status);
    boolean existsByRoomName(String roomName);
}
