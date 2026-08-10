package fit.quanlyspa.repository;

import fit.quanlyspa.entity.Order;
import fit.quanlyspa.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, String> {

    List<Order> findByOrderStatus(OrderStatus orderStatus);

    List<Order> findByOrderStatusIn(Collection<OrderStatus> statuses);

    Optional<Order> findFirstByAppointment_AppointmentIdAndOrderStatusIn(
            String appointmentId,
            Collection<OrderStatus> statuses);

    boolean existsByAppointment_AppointmentIdAndOrderStatusIn(
            String appointmentId,
            Collection<OrderStatus> statuses);
}
