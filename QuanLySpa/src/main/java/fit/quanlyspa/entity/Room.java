package fit.quanlyspa.entity;

import fit.quanlyspa.enums.RoomStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "rooms")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "room_id", updatable = false)
    String roomId;

    @Column(name = "room_name", nullable = false, unique = true, length = 100)
    String roomName;

    @Column(name = "room_number", length = 20)
    String roomNumber;

    @Column(name = "capacity")
    @Builder.Default
    int capacity = 1;

    @Column(name = "description", length = 300)
    String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    @Builder.Default
    RoomStatus status = RoomStatus.AVAILABLE;
}
