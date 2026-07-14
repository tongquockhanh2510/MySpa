package fit.quanlyspa.service;

import fit.quanlyspa.dto.request.order.PaymentProcessRequest;
import fit.quanlyspa.configuration.PricingProperties;
import fit.quanlyspa.entity.AppoinmentDetail;
import fit.quanlyspa.entity.Appointment;
import fit.quanlyspa.entity.Customer;
import fit.quanlyspa.entity.Employee;
import fit.quanlyspa.entity.Invoice;
import fit.quanlyspa.entity.Order;
import fit.quanlyspa.entity.OrderItem;
import fit.quanlyspa.entity.Payment;
import fit.quanlyspa.entity.Room;
import fit.quanlyspa.enums.OrderItemType;
import fit.quanlyspa.enums.OrderStatus;
import fit.quanlyspa.enums.PaymentMethod;
import fit.quanlyspa.enums.RoomStatus;
import fit.quanlyspa.enums.StatusOfAppointment;
import fit.quanlyspa.enums.StatusOfEmployee;
import fit.quanlyspa.enums.StatusOfService;
import fit.quanlyspa.exception.AppException;
import fit.quanlyspa.exception.ErrorCode;
import fit.quanlyspa.repository.AppoinmentDetailRepository;
import fit.quanlyspa.repository.AppointmentRepository;
import fit.quanlyspa.repository.CustomerRepository;
import fit.quanlyspa.repository.CustomerTreatmentRepository;
import fit.quanlyspa.repository.EmployeeRepository;
import fit.quanlyspa.repository.InventoryRepository;
import fit.quanlyspa.repository.InventoryTransactionRepository;
import fit.quanlyspa.repository.InvoiceDetailRepository;
import fit.quanlyspa.repository.InvoiceRepository;
import fit.quanlyspa.repository.LoyaltyPointRepository;
import fit.quanlyspa.repository.OrderItemRepository;
import fit.quanlyspa.repository.OrderRepository;
import fit.quanlyspa.repository.PackageConversionRepository;
import fit.quanlyspa.repository.PaymentRepository;
import fit.quanlyspa.repository.PaymentTransactionRepository;
import fit.quanlyspa.repository.ProductRepository;
import fit.quanlyspa.repository.PromotionRepository;
import fit.quanlyspa.repository.PromotionUsageRepository;
import fit.quanlyspa.repository.RoomRepository;
import fit.quanlyspa.repository.ServiceRepository;
import fit.quanlyspa.repository.TreatmentPackageRepository;
import fit.quanlyspa.repository.TreatmentScheduleRepository;
import fit.quanlyspa.repository.VoucherRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock OrderRepository orderRepository;
    @Mock OrderItemRepository orderItemRepository;
    @Mock CustomerRepository customerRepository;
    @Mock CustomerService customerService;
    @Mock ProductRepository productRepository;
    @Mock ServiceRepository serviceRepository;
    @Mock TreatmentPackageRepository treatmentPackageRepository;
    @Mock VoucherRepository voucherRepository;
    @Mock PromotionRepository promotionRepository;
    @Mock PromotionUsageRepository promotionUsageRepository;
    @Mock PaymentRepository paymentRepository;
    @Mock PaymentTransactionRepository paymentTransactionRepository;
    @Mock LoyaltyPointRepository loyaltyPointRepository;
    @Mock CustomerTreatmentRepository customerTreatmentRepository;
    @Mock TreatmentScheduleRepository treatmentScheduleRepository;
    @Mock AppointmentRepository appointmentRepository;
    @Mock AppoinmentDetailRepository appointmentDetailRepository;
    @Mock RoomRepository roomRepository;
    @Mock EmployeeRepository employeeRepository;
    @Mock InventoryRepository inventoryRepository;
    @Mock InventoryTransactionRepository inventoryTransactionRepository;
    @Mock InvoiceRepository invoiceRepository;
    @Mock InvoiceDetailRepository invoiceDetailRepository;
    @Mock PackageConversionRepository packageConversionRepository;
    @Mock CommissionService commissionService;
    @Mock NotificationService notificationService;
    @Mock PricingProperties pricingProperties;
    @Mock DisplayCodeService displayCodeService;

    @InjectMocks OrderService orderService;

    @Test
    void processPayment_allowsCashOverpaymentAndRecordsChange() {
        Order order = payableOrder("order-1", BigDecimal.valueOf(100_000));
        when(orderRepository.findById("order-1")).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(paymentRepository.findByOrderId("order-1")).thenReturn(List.of());
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PaymentProcessRequest request = PaymentProcessRequest.builder()
                .amount(BigDecimal.valueOf(120_000))
                .paymentMethod(PaymentMethod.CASH)
                .build();

        orderService.processPayment("order-1", request, "admin");

        ArgumentCaptor<Payment> paymentCaptor = ArgumentCaptor.forClass(Payment.class);
        verify(paymentRepository).save(paymentCaptor.capture());
        Payment payment = paymentCaptor.getValue();

        assertEquals(BigDecimal.valueOf(100_000), payment.getAmount());
        assertEquals(BigDecimal.valueOf(20_000), payment.getChangeAmount());
        assertEquals(BigDecimal.valueOf(100_000), order.getPaidAmount());
        assertEquals(BigDecimal.ZERO, order.getRemainingAmount());
        assertEquals(OrderStatus.PAID, order.getOrderStatus());
    }

    @Test
    void processPayment_rejectsNonCashOverpayment() {
        Order order = payableOrder("order-2", BigDecimal.valueOf(100_000));
        when(orderRepository.findById("order-2")).thenReturn(Optional.of(order));

        PaymentProcessRequest request = PaymentProcessRequest.builder()
                .amount(BigDecimal.valueOf(120_000))
                .paymentMethod(PaymentMethod.BANK_TRANSFER)
                .build();

        AppException ex = assertThrows(AppException.class, () -> orderService.processPayment("order-2", request, "admin"));

        assertEquals(ErrorCode.PAYMENT_AMOUNT_EXCEEDS_REMAINING, ex.getErrorCode());
        verify(paymentRepository, never()).save(any(Payment.class));
    }

    @Test
    void processPayment_createsServiceAppointmentFromOrderItemSchedule() {
        Customer customer = customer("customer-1");
        fit.quanlyspa.entity.Service service = fit.quanlyspa.entity.Service.builder()
                .serviceId("service-1")
                .name("Facial")
                .price(100_000)
                .duration(60)
                .statusOfService(StatusOfService.ACTIVE)
                .build();
        Employee therapist = Employee.builder()
                .employeeId("employee-1")
                .name("Therapist")
                .statusOfEmployee(StatusOfEmployee.ACTIVE)
                .build();
        Room room = Room.builder()
                .roomId("room-1")
                .roomName("Room 1")
                .status(RoomStatus.AVAILABLE)
                .build();
        // Keep the test independent from the wall-clock time at which the suite runs.
        // now().plusDays(2) can fall outside the configured 08:00-21:00 opening hours.
        LocalDateTime scheduledAt = LocalDateTime.now().plusDays(2)
                .withHour(10).withMinute(0).withSecond(0).withNano(0);

        OrderItem item = OrderItem.builder()
                .itemType(OrderItemType.SERVICE)
                .service(service)
                .quantity(1)
                .unitPrice(BigDecimal.valueOf(100_000))
                .amount(BigDecimal.valueOf(100_000))
                .scheduledDateTime(scheduledAt)
                .scheduledTherapist(therapist)
                .scheduledRoom(room)
                .build();

        Order order = payableOrder("order-3", BigDecimal.valueOf(100_000));
        item.setOrder(order);
        order.setOrderItems(new HashSet<>(List.of(item)));

        when(orderRepository.findById("order-3")).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(paymentRepository.findByOrderId("order-3")).thenReturn(List.of());
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(appointmentRepository.findOverlappingForCustomer("customer-1", scheduledAt, scheduledAt.plusMinutes(60), null)).thenReturn(List.of());
        when(appointmentRepository.findTherapistConflicts("employee-1", scheduledAt, scheduledAt.plusMinutes(60), null)).thenReturn(List.of());
        when(roomRepository.findById("room-1")).thenReturn(Optional.of(room));
        when(appointmentRepository.findRoomConflicts("room-1", scheduledAt, scheduledAt.plusMinutes(60), null)).thenReturn(List.of());
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(invocation -> {
            Appointment appointment = invocation.getArgument(0);
            appointment.setAppointmentId("appointment-1");
            return appointment;
        });
        when(appointmentDetailRepository.save(any(AppoinmentDetail.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PaymentProcessRequest request = PaymentProcessRequest.builder()
                .amount(BigDecimal.valueOf(100_000))
                .paymentMethod(PaymentMethod.CASH)
                .build();

        orderService.processPayment("order-3", request, "admin");

        ArgumentCaptor<Appointment> appointmentCaptor = ArgumentCaptor.forClass(Appointment.class);
        verify(appointmentRepository).save(appointmentCaptor.capture());
        Appointment appointment = appointmentCaptor.getValue();
        assertEquals(scheduledAt, appointment.getDateTime());
        assertEquals(scheduledAt.plusMinutes(60), appointment.getEndTime());
        assertEquals(StatusOfAppointment.CONFIRMED, appointment.getStatusOfAppointment());
        assertEquals(room, appointment.getRoom());

        ArgumentCaptor<AppoinmentDetail> detailCaptor = ArgumentCaptor.forClass(AppoinmentDetail.class);
        verify(appointmentDetailRepository).save(detailCaptor.capture());
        AppoinmentDetail detail = detailCaptor.getValue();
        assertEquals(therapist, detail.getEmployee());
        assertNotNull(detail.getId());
    }

    private Order payableOrder(String orderId, BigDecimal amount) {
        Order order = Order.builder()
                .customer(customer("customer-1"))
                .orderStatus(OrderStatus.PENDING_PAYMENT)
                .subtotal(amount)
                .totalAmount(amount)
                .paidAmount(BigDecimal.ZERO)
                .remainingAmount(amount)
                .orderItems(new HashSet<>())
                .build();
        order.setOrderId(orderId);
        return order;
    }

    private Customer customer(String customerId) {
        Customer customer = new Customer();
        customer.setCustomerId(customerId);
        customer.setName("Customer");
        customer.setPhone("0900000000");
        customer.setLoyaltyPoints(0);
        return customer;
    }
}
