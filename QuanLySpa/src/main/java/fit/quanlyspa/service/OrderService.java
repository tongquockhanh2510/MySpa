package fit.quanlyspa.service;

import fit.quanlyspa.configuration.PricingProperties;
import fit.quanlyspa.dto.request.customer.CustomerRequest;
import fit.quanlyspa.dto.request.order.OrderItemRequest;
import fit.quanlyspa.dto.request.order.OrderRequest;
import fit.quanlyspa.dto.request.order.PaymentProcessRequest;
import fit.quanlyspa.dto.response.customer.CustomerResponse;
import fit.quanlyspa.dto.response.order.OrderItemResponse;
import fit.quanlyspa.dto.response.order.OrderResponse;
import fit.quanlyspa.entity.*;
import fit.quanlyspa.enums.*;
import fit.quanlyspa.exception.AppException;
import fit.quanlyspa.exception.ErrorCode;
import fit.quanlyspa.repository.*;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OrderService {

    OrderRepository orderRepository;
    OrderItemRepository orderItemRepository;
    CustomerRepository customerRepository;
    CustomerService customerService;
    ProductRepository productRepository;
    ServiceRepository serviceRepository;
    TreatmentPackageRepository treatmentPackageRepository;
    VoucherRepository voucherRepository;
    PromotionRepository promotionRepository;
    PromotionUsageRepository promotionUsageRepository;
    PaymentRepository paymentRepository;
    PaymentTransactionRepository paymentTransactionRepository;
    LoyaltyPointRepository loyaltyPointRepository;
    CustomerTreatmentRepository customerTreatmentRepository;
    TreatmentScheduleRepository treatmentScheduleRepository;
    AppointmentRepository appointmentRepository;
    AppoinmentDetailRepository appointmentDetailRepository;
    RoomRepository roomRepository;
    EmployeeRepository employeeRepository;
    InventoryRepository inventoryRepository;
    InventoryTransactionRepository inventoryTransactionRepository;
    InvoiceRepository invoiceRepository;
    InvoiceDetailRepository invoiceDetailRepository;
    CommissionService commissionService;
    NotificationService notificationService;
    PricingProperties pricingProperties;
    DisplayCodeService displayCodeService;
    fit.quanlyspa.configuration.BusinessHoursProperties businessHours;

    // ===== STEP 1, 2, 3: CREATE ORDER DRAFT =====
    @Transactional
    public OrderResponse createOrder(OrderRequest request, String createdBy) {
        if (request.getAppointmentId() != null && !request.getAppointmentId().isBlank()) {
            return createOrderFromAppointment(request.getAppointmentId(), request, createdBy);
        }
        return createWalkInOrder(request, createdBy);
    }

    @Transactional
    public OrderResponse createWalkInOrder(OrderRequest request, String createdBy) {
        return createOrderDraft(null, request, createdBy);
    }

    @Transactional
    public OrderResponse createOrderFromAppointment(String appointmentId, OrderRequest request, String createdBy) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new AppException(ErrorCode.APPOINTMENT_NOT_FOUND));

        if (appointment.getStatusOfAppointment() == StatusOfAppointment.COMPLETED
                || appointment.getStatusOfAppointment() == StatusOfAppointment.CANCELLED
                || appointment.getStatusOfAppointment() == StatusOfAppointment.NO_SHOW) {
            throw new AppException(ErrorCode.OPERATION_NOT_ALLOWED,
                    "Lịch hẹn đã kết thúc, không thể tạo thêm đơn hàng thanh toán");
        }

        Optional<Order> existingOrder = orderRepository.findFirstByAppointment_AppointmentIdAndOrderStatusIn(
                appointmentId,
                List.of(OrderStatus.DRAFT, OrderStatus.PENDING_PAYMENT, OrderStatus.PARTIALLY_PAID));
        if (existingOrder.isPresent()) {
            return toOrderResponse(existingOrder.get());
        }

        // Lịch hẹn đã có đơn hàng thanh toán đầy đủ rồi thì không cho tạo đơn mới để tránh thanh toán 2 lần
        if (orderRepository.existsByAppointment_AppointmentIdAndOrderStatusIn(
                appointmentId, List.of(OrderStatus.PAID, OrderStatus.COMPLETED))) {
            throw new AppException(ErrorCode.OPERATION_NOT_ALLOWED,
                    "Lịch hẹn này đã được thanh toán, không thể tạo thêm đơn hàng");
        }

        if (request.getCustomerId() == null || request.getCustomerId().isBlank()) {
            request.setCustomerId(appointment.getCustomer().getCustomerId());
        } else if (!request.getCustomerId().equals(appointment.getCustomer().getCustomerId())) {
            throw new AppException(ErrorCode.VALIDATION_ERROR,
                    "Don hang cua lich hen phai dung khach hang tren lich hen");
        }

        return createOrderDraft(appointment, request, createdBy);
    }

    private OrderResponse createOrderDraft(Appointment sourceAppointment, OrderRequest request, String createdBy) {
        Customer customer;

        // STEP 1 - CUSTOMER SELECTION
        if (sourceAppointment != null) {
            customer = sourceAppointment.getCustomer();
        } else if (request.getCustomerId() != null && !request.getCustomerId().isBlank()) {
            customer = customerRepository.findById(request.getCustomerId())
                    .orElseThrow(() -> new AppException(ErrorCode.CUSTOMER_NOT_FOUND));
        } else if (request.getNewCustomer() != null) {
            CustomerResponse customerResp = customerService.create(request.getNewCustomer());
            customer = customerRepository.findById(customerResp.getCustomerId())
                    .orElseThrow(() -> new AppException(ErrorCode.CUSTOMER_NOT_FOUND));
        } else {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Cần chọn khách hàng cũ hoặc nhập thông tin khách hàng mới");
        }

        // Build Order entity
        Order order = Order.builder()
                .displayCode(displayCodeService.nextOrderCode(LocalDate.now()))
                .customer(customer)
                .appointment(sourceAppointment)
                .orderStatus(OrderStatus.DRAFT)
                .createdBy(createdBy)
                .build();

        order = orderRepository.save(order);

        // STEP 2 - ADD ORDER ITEMS & CALCULATE SUBTOTAL
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal serviceSubtotal = BigDecimal.ZERO; // To apply membership discount only on services
        Set<OrderItem> orderItems = new HashSet<>();

        for (OrderItemRequest itemReq : request.getItems()) {
            OrderItem.OrderItemBuilder item = OrderItem.builder().order(order).quantity(itemReq.getQuantity()).itemType(itemReq.getItemType());
            BigDecimal unitPrice = BigDecimal.ZERO;

            if (itemReq.getItemType() == OrderItemType.PRODUCT) {
                Product product = productRepository.findById(itemReq.getProductId())
                        .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
                unitPrice = BigDecimal.valueOf(product.getPrice());
                item.product(product);
            } else if (itemReq.getItemType() == OrderItemType.SERVICE) {
                fit.quanlyspa.entity.Service service = serviceRepository.findById(itemReq.getServiceId())
                        .orElseThrow(() -> new AppException(ErrorCode.SERVICE_NOT_FOUND));
                unitPrice = BigDecimal.valueOf(service.getPrice());
                item.service(service);
                ServiceSchedule schedule = validateServiceSchedule(itemReq, service, customer,
                        sourceAppointment != null ? sourceAppointment.getAppointmentId() : null);
                item.scheduledDateTime(schedule.startTime());
                item.scheduledTherapist(schedule.therapist());
                item.scheduledRoom(schedule.room());
            } else if (itemReq.getItemType() == OrderItemType.PACKAGE) {
                TreatmentPackage pack = treatmentPackageRepository.findById(itemReq.getPackageId())
                        .orElseThrow(() -> new AppException(ErrorCode.PACKAGE_NOT_FOUND));
                unitPrice = BigDecimal.valueOf(pack.getPackagePrice());
                item.treatmentPackage(pack);
            }

            BigDecimal amount = unitPrice.multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            subtotal = subtotal.add(amount);

            if (itemReq.getItemType() == OrderItemType.SERVICE) {
                serviceSubtotal = serviceSubtotal.add(amount);
            }

            item.unitPrice(unitPrice);
            item.amount(amount);

            OrderItem savedItem = orderItemRepository.save(item.build());
            orderItems.add(savedItem);
        }

        order.setOrderItems(orderItems);
        order.setSubtotal(subtotal);

        // STEP 3 - ORDER CALCULATIONS (PROMO, VOUCHER, MEMBERSHIP)
        BigDecimal promoDiscount = BigDecimal.ZERO;
        BigDecimal voucherDiscount = BigDecimal.ZERO;
        BigDecimal membershipDiscount = BigDecimal.ZERO;

        // A. Promotion Discount
        if (request.getPromotionId() != null && !request.getPromotionId().isBlank()) {
            Promotion promotion = promotionRepository.findById(request.getPromotionId())
                    .orElseThrow(() -> new AppException(ErrorCode.PROMOTION_NOT_FOUND));
            validatePromotionUsable(promotion, subtotal);
            if (promotion.getMaxUsesPerCustomer() != null) {
                long customerUses = promotionUsageRepository
                        .countByPromotion_PromotionIdAndCustomer_CustomerId(
                                promotion.getPromotionId(), customer.getCustomerId());
                if (customerUses >= promotion.getMaxUsesPerCustomer()) {
                    throw new AppException(ErrorCode.VALIDATION_ERROR,
                            "Khách hàng đã dùng hết số lượt cho khuyến mãi này");
                }
            }
            BigDecimal promotionBase = calculatePromotionBase(orderItems, subtotal, promotion);
            promoDiscount = calculatePromoDiscount(promotionBase, promotion);
            order.setPromoDiscount(promoDiscount);
            order.setPromotion(promotion);
        }

        // B. Voucher Discount
        if (request.getVoucherCode() != null && !request.getVoucherCode().isBlank()) {
            Voucher voucher = voucherRepository.findByCode(request.getVoucherCode())
                    .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_FOUND));
            
            if (voucher.isUsed()) {
                throw new AppException(ErrorCode.VOUCHER_ALREADY_USED);
            }
            if (voucher.getExpiryDate() != null && voucher.getExpiryDate().isBefore(LocalDateTime.now())) {
                throw new AppException(ErrorCode.VOUCHER_EXPIRED);
            }
            if (subtotal.compareTo(voucher.getMinOrderValue()) < 0) {
                throw new AppException(ErrorCode.ORDER_VALUE_BELOW_MINIMUM);
            }

            voucherDiscount = calculateVoucherDiscount(subtotal.subtract(promoDiscount), voucher);
            order.setVoucherDiscount(voucherDiscount);
            
            voucher.setUsed(true);
            voucher.setUsedAt(LocalDateTime.now());
            voucherRepository.save(voucher);
        }

        // C. Membership Discount (Applies to services only)
        if (customer.getMembership() != null && customer.getMembership().getTier() != null) {
            double tierDiscountPercent = customer.getMembership().getTier().getDiscountPercent();
            if (tierDiscountPercent > 0) {
                membershipDiscount = serviceSubtotal.multiply(BigDecimal.valueOf(tierDiscountPercent / 100.0))
                        .setScale(2, RoundingMode.HALF_UP);
                order.setMembershipDiscount(membershipDiscount);
            }
        }

        // D. Loyalty point redemption (1 diem = 1.000d), ap dung sau cac giam gia khac
        BigDecimal loyaltyDiscount = BigDecimal.ZERO;
        if (request.getLoyaltyPointsToUse() != null && request.getLoyaltyPointsToUse() > 0) {
            double pointsRequested = request.getLoyaltyPointsToUse();
            if (pointsRequested != Math.floor(pointsRequested)) {
                throw new AppException(ErrorCode.VALIDATION_ERROR, "Điểm tích lũy phải là số nguyên");
            }
            if (pointsRequested > customer.getLoyaltyPoints()) {
                throw new AppException(ErrorCode.VALIDATION_ERROR,
                        "Khách hàng chỉ có " + customer.getLoyaltyPoints() + " điểm, không đủ " + pointsRequested + " điểm để quy đổi");
            }

            BigDecimal amountAfterDiscounts = subtotal.subtract(promoDiscount).subtract(voucherDiscount).subtract(membershipDiscount);
            if (amountAfterDiscounts.compareTo(BigDecimal.ZERO) < 0) amountAfterDiscounts = BigDecimal.ZERO;

            loyaltyDiscount = BigDecimal.valueOf(pointsRequested * 1000).setScale(2, RoundingMode.HALF_UP);
            if (loyaltyDiscount.compareTo(amountAfterDiscounts) > 0) {
                // Khong cho tru qua so tien con lai — chi tieu dung so diem thuc su can
                loyaltyDiscount = amountAfterDiscounts;
            }
            double pointsUsed = loyaltyDiscount.divide(BigDecimal.valueOf(1000), 2, RoundingMode.UP).doubleValue();

            if (pointsUsed > 0) {
                customer.setLoyaltyPoints(customer.getLoyaltyPoints() - pointsUsed);
                customerRepository.save(customer);

                LoyaltyPoint redemption = LoyaltyPoint.builder()
                        .customer(customer)
                        .points(-pointsUsed)
                        .transactionType("REDEEM")
                        .description("Quy đổi điểm thanh toán đơn " + order.getOrderId())
                        .referenceId(order.getOrderId())
                        .referenceType("ORDER")
                        .balanceAfter(customer.getLoyaltyPoints())
                        .build();
                loyaltyPointRepository.save(redemption);

                if (customer.getMembership() != null) {
                    Membership mem = customer.getMembership();
                    mem.setPointsBalance(Math.max(0, mem.getPointsBalance() - pointsUsed));
                }

                order.setLoyaltyDiscount(loyaltyDiscount);
                order.setLoyaltyPointsUsed(pointsUsed);
            }
        }

        // E. Tax (e.g. 10% VAT, optional)
        BigDecimal taxableAmount = subtotal.subtract(promoDiscount).subtract(voucherDiscount)
                .subtract(membershipDiscount).subtract(loyaltyDiscount);
        if (taxableAmount.compareTo(BigDecimal.ZERO) < 0) taxableAmount = BigDecimal.ZERO;
        
        BigDecimal rate = pricingProperties.getVatRate().max(BigDecimal.ZERO);
        BigDecimal taxAmount;
        BigDecimal totalAmount;
        if (pricingProperties.isVatInclusive()) {
            BigDecimal divisor = BigDecimal.valueOf(100).add(rate);
            taxAmount = rate.signum() == 0 ? BigDecimal.ZERO
                    : taxableAmount.multiply(rate).divide(divisor, 2, RoundingMode.HALF_UP);
            totalAmount = taxableAmount.setScale(2, RoundingMode.HALF_UP);
        } else {
            taxAmount = taxableAmount.multiply(rate)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            totalAmount = taxableAmount.add(taxAmount).setScale(2, RoundingMode.HALF_UP);
        }
        order.setTaxAmount(taxAmount);

        // E. Final Amount & Grand Total
        order.setTotalAmount(totalAmount);
        order.setRemainingAmount(totalAmount);
        order.setOrderStatus(OrderStatus.PENDING_PAYMENT);

        order = orderRepository.save(order);
        log.info("Order created with status PENDING_PAYMENT, ID: {}", order.getOrderId());

        return toOrderResponse(order);
    }

    // ===== STEP 4: PAYMENT AND POST-PAYMENT FLOWS =====
    @Transactional
    public OrderResponse processPayment(String orderId, PaymentProcessRequest request, String processedBy) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        if (order.getOrderStatus() == OrderStatus.PAID || order.getOrderStatus() == OrderStatus.COMPLETED) {
            throw new AppException(ErrorCode.INVOICE_ALREADY_PAID, "Đơn hàng này đã thanh toán hoàn tất");
        }
        if (order.getOrderStatus() == OrderStatus.CANCELLED) {
            throw new AppException(ErrorCode.INVOICE_CANCELLED, "Đơn hàng này đã bị hủy");
        }
        if (request.getAmount().compareTo(order.getRemainingAmount()) > 0
                && request.getPaymentMethod() != PaymentMethod.CASH) {
            throw new AppException(ErrorCode.PAYMENT_AMOUNT_EXCEEDS_REMAINING);
        }

        // Create Payment entity
        BigDecimal change = BigDecimal.ZERO;
        BigDecimal paidAmt = request.getAmount();
        
        if (request.getPaymentMethod() == PaymentMethod.CASH && request.getAmount().compareTo(order.getRemainingAmount()) > 0) {
            change = request.getAmount().subtract(order.getRemainingAmount());
            paidAmt = order.getRemainingAmount();
        }

        Payment payment = Payment.builder()
                .order(order)
                .amount(paidAmt)
                .paymentMethod(request.getPaymentMethod())
                .status(PaymentStatus.SUCCESS)
                .transactionReference(request.getTransactionReference())
                .changeAmount(change)
                .approvedBy(processedBy)
                .processedAt(LocalDateTime.now())
                .note(request.getNotes())
                .build();

        paymentRepository.save(payment);

        // Create Payment Transaction Log
        PaymentTransaction txn = PaymentTransaction.builder()
                .order(order)
                .amount(paidAmt)
                .paymentMethod(request.getPaymentMethod())
                .status(PaymentStatus.SUCCESS)
                .transactionReference(request.getTransactionReference())
                .notes(request.getNotes())
                .build();
        
        paymentTransactionRepository.save(txn);

        // Update Order paid metrics
        order.setPaidAmount(order.getPaidAmount().add(paidAmt));
        order.setRemainingAmount(order.getTotalAmount().subtract(order.getPaidAmount()));

        // Update Order Status
        if (order.getRemainingAmount().compareTo(BigDecimal.ZERO) <= 0) {
            order.setOrderStatus(OrderStatus.PAID);
            consumePromotion(order);

            // Execute Post-payment workflows
            executePostPaymentFlows(order, processedBy);

            notificationService.notify(NotificationType.PAYMENT_SUCCESS,
                    "Thanh toán thành công",
                    "Đơn hàng " + order.getOrderId() + " của khách " + order.getCustomer().getName()
                            + " đã thanh toán đủ " + order.getTotalAmount() + "đ (" + request.getPaymentMethod() + ")",
                    order.getOrderId(), "ORDER", order.getCustomer());
        } else {
            order.setOrderStatus(OrderStatus.PARTIALLY_PAID);
        }

        orderRepository.save(order);
        log.info("Processed payment of {} for order {}. Remaining: {}", paidAmt, orderId, order.getRemainingAmount());

        return toOrderResponse(order);
    }

    // ===== POST PAYMENT FLOW EXECUTIONS =====
    private void executePostPaymentFlows(Order order, String processedBy) {
        Customer customer = order.getCustomer();

        for (OrderItem item : order.getOrderItems()) {
            
            // STEP 5: PRODUCT PURCHASE FLOW (Reduce inventory, log txn)
            if (item.getItemType() == OrderItemType.PRODUCT && item.getProduct() != null) {
                Inventory inv = inventoryRepository.findByProduct_ProductId(item.getProduct().getProductId())
                        .orElseThrow(() -> new AppException(ErrorCode.INVENTORY_NOT_FOUND, "Không tìm thấy kho cho sản phẩm " + item.getProduct().getName()));
                
                if (inv.getQuantityInStock() < item.getQuantity()) {
                    throw new AppException(ErrorCode.INSUFFICIENT_STOCK, "Sản phẩm " + item.getProduct().getName() + " không đủ tồn kho");
                }
                
                double quantityBefore = inv.getQuantityInStock();
                inv.setQuantityInStock(quantityBefore - item.getQuantity());
                inventoryRepository.save(inv);

                InventoryTransaction invTxn = InventoryTransaction.builder()
                        .product(item.getProduct())
                        .transactionType(InventoryTransactionType.STOCK_OUT)
                        .quantity(item.getQuantity())
                        .quantityBefore(quantityBefore)
                        .quantityAfter(inv.getQuantityInStock())
                        .unitCost(item.getProduct().getPrice())
                        .referenceId(order.getOrderId())
                        .note("Bán hàng theo đơn: " + order.getOrderId())
                        .createdBy(processedBy)
                        .build();
                inventoryTransactionRepository.save(invTxn);

                if (inv.getQuantityInStock() <= item.getProduct().getMinStockLevel()) {
                    notificationService.notify(NotificationType.LOW_STOCK_ALERT,
                            "Sản phẩm sắp hết hàng",
                            "Sản phẩm " + item.getProduct().getName() + " chỉ còn " + inv.getQuantityInStock()
                                    + " " + (item.getProduct().getUnit() != null ? item.getProduct().getUnit() : "sp") + " trong kho",
                            item.getProduct().getProductId(), "PRODUCT", null);
                }
            }
            // STEP 6: SERVICE PURCHASE FLOW
            else if (item.getItemType() == OrderItemType.SERVICE && item.getService() != null) {
                ServiceSchedule schedule = validateStoredServiceSchedule(item, customer, order.getAppointment());
                if (order.getAppointment() == null) {
                    Appointment appointment = Appointment.builder()
                            .displayCode(displayCodeService.nextAppointmentCode(schedule.startTime().toLocalDate()))
                            .customer(customer)
                            .room(schedule.room())
                            .dateTime(schedule.startTime())
                            .endTime(schedule.endTime())
                            .statusOfAppointment(StatusOfAppointment.CONFIRMED)
                            .createdBy(processedBy)
                            .note("Tạo từ đơn " + shortOrderCode(order.getOrderId()))
                            .build();
                    appointment = appointmentRepository.save(appointment);

                    AppoinmentDetail detail = new AppoinmentDetail();
                    detail.setId(new AppoimentDetalId(
                            appointment.getAppointmentId(),
                            item.getService().getServiceId(),
                            schedule.therapist().getEmployeeId()));
                    detail.setAppointment(appointment);
                    detail.setService(item.getService());
                    detail.setEmployee(schedule.therapist());
                    detail.setPrice(item.getUnitPrice().doubleValue());
                    appointmentDetailRepository.save(detail);
                    appointment.getDetails().add(detail);
                    order.setAppointment(appointment);
                }
            }
            
            // STEP 7 & 8: PACKAGE PURCHASE FLOW (Create customer package and schedules)
            else if (item.getItemType() == OrderItemType.PACKAGE && item.getTreatmentPackage() != null) {
                TreatmentPackage pack = item.getTreatmentPackage();
                
                CustomerTreatment custTreatment = new CustomerTreatment();
                CustomerTreatmentId treatId = new CustomerTreatmentId(customer.getCustomerId(), pack.getTreatmentPackageId());
                custTreatment.setId(treatId);
                custTreatment.setCustomer(customer);
                custTreatment.setTreatmentPackage(pack);
                custTreatment.setRemainingSessions(pack.getTotalSessions());
                custTreatment.setSourceOrderId(order.getOrderId()); // ISS-006: nguồn để hồi tố hoa hồng khi quy đổi
                custTreatment.setPurchaseDate(LocalDate.now());
                custTreatment.setExpiryDate(LocalDate.now().plusDays(365)); // 1 year validity
                
                custTreatment = customerTreatmentRepository.saveAndFlush(custTreatment);
                log.info("Created Customer Package for customer {} and package {}", customer.getName(), pack.getPackageName());

                // STEP 8: Auto-generate treatment schedules weekly
                Employee therapist = employeeRepository.findAll().stream().filter(e -> e.getStatusOfEmployee() == StatusOfEmployee.ACTIVE).findFirst().orElse(null);
                Room room = roomRepository.findAll().stream().filter(r -> r.getStatus() == RoomStatus.AVAILABLE).findFirst().orElse(null);

                List<TreatmentSchedule> schedules = new ArrayList<>();
                for (int i = 1; i <= pack.getTotalSessions(); i++) {
                    TreatmentSchedule schedule = TreatmentSchedule.builder()
                            .customerTreatment(custTreatment)
                            .sessionNumber(i)
                            .scheduledDate(LocalDate.now().plusWeeks(i)) // session weekly
                            .therapist(therapist)
                            .room(room)
                            .status(TreatmentScheduleStatus.SCHEDULED)
                            .build();
                    schedules.add(schedule);
                }
                treatmentScheduleRepository.saveAll(schedules);
                log.info("Auto-generated {} weekly treatment schedules for customer package", pack.getTotalSessions());

                // Sinh hoa hồng cho người phụ trách gói khi bán gói liệu trình
                commissionService.generateForPackageSale(order, item);
            }
        }

        // STEP 11: LOYALTY POINTS (100,000 VND = 1 Point)
        double pointsEarned = order.getTotalAmount().divide(BigDecimal.valueOf(100000), 0, RoundingMode.DOWN).doubleValue();
        if (pointsEarned > 0) {
            customerService.addLoyaltyPoints(customer.getCustomerId(), pointsEarned, "Mua hàng theo đơn " + order.getOrderId());
            
            // Record loyalty point transaction history
            LoyaltyPoint pointHistory = LoyaltyPoint.builder()
                    .customer(customer)
                    .points(pointsEarned)
                    .transactionType("EARN")
                    .description("Mua hàng tích lũy từ đơn " + order.getOrderId())
                    .referenceId(order.getOrderId())
                    .referenceType("ORDER")
                    .balanceAfter(customer.getLoyaltyPoints() + pointsEarned)
                    .build();
            loyaltyPointRepository.save(pointHistory);
            
            // Update Membership points balance if exists
            if (customer.getMembership() != null) {
                Membership mem = customer.getMembership();
                mem.setPointsBalance(mem.getPointsBalance() + pointsEarned);
                mem.setPointsEarnedTotal(mem.getPointsEarnedTotal() + pointsEarned);
                
                // Recalculate tier based on total spent
                mem.setTotalSpent(mem.getTotalSpent().add(order.getTotalAmount()));
                // Optional: trigger tier upgrade check
            }
        }

        // STEP 12: AUTO-GENERATE INVOICE
        generateInvoiceFromOrder(order, processedBy);
        completeSourceAppointmentIfNeeded(order);
    }

    private void consumePromotion(Order order) {
        Promotion promotion = order.getPromotion();
        if (promotion == null || order.getPromoDiscount() == null
                || order.getPromoDiscount().compareTo(BigDecimal.ZERO) <= 0
                || promotionUsageRepository.existsByPromotion_PromotionIdAndOrder_OrderId(
                        promotion.getPromotionId(), order.getOrderId())) {
            return;
        }
        if (promotion.getQuantity() != null) {
            if (promotion.getQuantity() <= 0) {
                throw new AppException(ErrorCode.VALIDATION_ERROR, "Khuyến mãi đã hết lượt sử dụng");
            }
            promotion.setQuantity(promotion.getQuantity() - 1);
            promotionRepository.save(promotion);
        }
        promotionUsageRepository.save(PromotionUsage.builder()
                .promotion(promotion)
                .customer(order.getCustomer())
                .order(order)
                .build());
    }

    private void generateInvoiceFromOrder(Order order, String createdBy) {
        if (order.getAppointment() != null) {
            Optional<Invoice> paidInvoice = invoiceRepository.findFirstByAppointment_AppointmentIdAndStatus(
                    order.getAppointment().getAppointmentId(), InvoiceStatus.PAID);
            if (paidInvoice.isPresent()) {
                log.info("Skip invoice generation for appointment {} because paid invoice {} already exists",
                        order.getAppointment().getAppointmentId(), paidInvoice.get().getInvoiceNumber());
                return;
            }
        }

        Invoice invoice = Invoice.builder()
                .invoiceNumber("INV-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "-" + String.format("%04d", (int)(Math.random() * 9999) + 1))
                .customer(order.getCustomer())
                .appointment(order.getAppointment())
                .status(InvoiceStatus.PAID)
                .subtotal(order.getSubtotal())
                .discountAmount(order.getPromoDiscount().add(order.getVoucherDiscount())
                        .add(order.getMembershipDiscount())
                        .add(order.getLoyaltyDiscount() == null ? BigDecimal.ZERO : order.getLoyaltyDiscount()))
                .loyaltyPointsUsed(order.getLoyaltyPointsUsed() == null ? 0 : order.getLoyaltyPointsUsed())
                .taxAmount(order.getTaxAmount())
                .totalAmount(order.getTotalAmount())
                .paidAmount(order.getPaidAmount())
                .remainingAmount(BigDecimal.ZERO)
                .note("Hóa đơn tự động sinh từ đơn hàng: " + order.getOrderId())
                .createdBy(createdBy)
                .paidAt(LocalDateTime.now())
                .build();

        invoice = invoiceRepository.save(invoice);

        List<InvoiceDetail> details = new ArrayList<>();
        for (OrderItem item : order.getOrderItems()) {
            String name = "";
            if (item.getItemType() == OrderItemType.PRODUCT && item.getProduct() != null) {
                name = item.getProduct().getName();
            } else if (item.getItemType() == OrderItemType.SERVICE && item.getService() != null) {
                name = item.getService().getName();
            } else if (item.getItemType() == OrderItemType.PACKAGE && item.getTreatmentPackage() != null) {
                name = item.getTreatmentPackage().getPackageName();
            }

            InvoiceDetail det = InvoiceDetail.builder()
                    .invoice(invoice)
                    .itemName(name)
                    .itemType(item.getItemType().name())
                    .quantity(item.getQuantity())
                    .unitPrice(item.getUnitPrice())
                    .amount(item.getAmount())
                    .product(item.getProduct())
                    .service(item.getService())
                    .treatmentPackage(item.getTreatmentPackage())
                    .build();
            
            invoiceDetailRepository.save(det);
            details.add(det);
        }
        invoice.setDetails(details);
        invoiceRepository.save(invoice);
        log.info("Invoice generated from order {}: {}", order.getOrderId(), invoice.getInvoiceNumber());
    }

    private void completeSourceAppointmentIfNeeded(Order order) {
        Appointment appointment = order.getAppointment();
        if (appointment == null) {
            return;
        }
        if (appointment.getStatusOfAppointment() == StatusOfAppointment.CANCELLED
                || appointment.getStatusOfAppointment() == StatusOfAppointment.NO_SHOW) {
            throw new AppException(ErrorCode.OPERATION_NOT_ALLOWED,
                    "Lich hen da huy hoac khach khong den, khong the hoan tat thanh toan");
        }
        // Payment must never advance the operational appointment state. A prepaid
        // future service remains CONFIRMED; commission is generated only after the
        // appointment state machine has completed it.
        if (appointment.getStatusOfAppointment() == StatusOfAppointment.COMPLETED) {
            commissionService.generateForCompletedAppointment(appointment);
        }
    }

    // ===== READ OPERATIONS =====
    public OrderResponse getOrderById(String orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        return toOrderResponse(order);
    }

    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAll().stream()
                .map(this::toOrderResponse)
                .collect(Collectors.toList());
    }

    // ===== REFUND =====

    /**
     * Hoàn / hủy một đơn đã thanh toán. Đảo ngược các tác động tài chính:
     * - Trả lại tồn kho sản phẩm (giao dịch RETURN) nếu đơn đã trừ kho.
     * - Sinh hoa hồng ÂM hồi tố cho nhân viên (không xóa bản ghi gốc).
     * - Trừ lại điểm tích lũy đã cộng (không để âm).
     * - Ghi log giao dịch hoàn tiền và chuyển trạng thái đơn sang REFUNDED.
     */
    @Transactional
    public OrderResponse refundOrder(String orderId, String reason, String processedBy) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        if (order.getOrderStatus() == OrderStatus.REFUNDED
                || order.getOrderStatus() == OrderStatus.CANCELLED) {
            throw new AppException(ErrorCode.OPERATION_NOT_ALLOWED, "Đơn hàng đã được hoàn hoặc đã hủy");
        }
        boolean stockWasDeducted = order.getOrderStatus() == OrderStatus.PAID
                || order.getOrderStatus() == OrderStatus.COMPLETED;
        if (order.getPaidAmount() == null || order.getPaidAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppException(ErrorCode.OPERATION_NOT_ALLOWED, "Đơn chưa phát sinh thanh toán, không cần hoàn tiền");
        }

        // 1) Trả lại tồn kho các sản phẩm đã xuất
        if (stockWasDeducted) {
            for (OrderItem item : order.getOrderItems()) {
                if (item.getItemType() == OrderItemType.PRODUCT && item.getProduct() != null) {
                    inventoryRepository.findByProduct_ProductId(item.getProduct().getProductId())
                            .ifPresent(inv -> {
                                double before = inv.getQuantityInStock();
                                inv.setQuantityInStock(before + item.getQuantity());
                                inventoryRepository.save(inv);
                                inventoryTransactionRepository.save(InventoryTransaction.builder()
                                        .product(item.getProduct())
                                        .transactionType(InventoryTransactionType.RETURN)
                                        .quantity(item.getQuantity())
                                        .quantityBefore(before)
                                        .quantityAfter(inv.getQuantityInStock())
                                        .unitCost(item.getProduct().getPrice())
                                        .referenceId(order.getOrderId())
                                        .note("Hoàn hàng do hoàn đơn: " + order.getOrderId())
                                        .createdBy(processedBy)
                                        .build());
                            });
                }
            }
        }

        // 2) Hồi tố hoa hồng (sinh bản ghi âm)
        int reversed = commissionService.reverseForOrder(order);

        // 3) Trừ lại điểm tích lũy đã cộng khi thanh toán (không để âm)
        if (order.getCustomer() != null && order.getTotalAmount() != null) {
            double pointsEarned = order.getTotalAmount()
                    .divide(BigDecimal.valueOf(100000), 0, RoundingMode.DOWN).doubleValue();
            double reclaim = Math.min(pointsEarned, order.getCustomer().getLoyaltyPoints());
            if (reclaim > 0) {
                customerService.addLoyaltyPoints(order.getCustomer().getCustomerId(), -reclaim,
                        "Hoàn điểm do hoàn đơn " + order.getOrderId());
            }
        }

        // 4) Ghi log giao dịch hoàn tiền
        BigDecimal refundAmount = order.getPaidAmount();
        paymentTransactionRepository.save(PaymentTransaction.builder()
                .order(order)
                .amount(refundAmount.negate())
                .paymentMethod(PaymentMethod.CASH)
                .status(PaymentStatus.REFUNDED)
                .notes("Hoàn tiền đơn " + order.getOrderId()
                        + (reason != null && !reason.isBlank() ? " - Lý do: " + reason : ""))
                .build());

        // 5) Chuyển trạng thái
        order.setOrderStatus(OrderStatus.REFUNDED);
        orderRepository.save(order);
        log.info("Refunded order {} amount {} - reversed {} commission records", orderId, refundAmount, reversed);

        notificationService.notify(NotificationType.PAYMENT_SUCCESS,
                "Hoàn tiền đơn hàng",
                "Đơn " + order.getOrderId() + " đã được hoàn tiền " + refundAmount + "đ"
                        + (reversed > 0 ? " và hồi tố " + reversed + " dòng hoa hồng" : ""),
                order.getOrderId(), "ORDER", order.getCustomer());

        return toOrderResponse(order);
    }

    // ===== CALCULATION HELPER METHODS =====
    private void validatePromotionUsable(Promotion promotion, BigDecimal subtotal) {
        LocalDateTime now = LocalDateTime.now();
        if (promotion.getIsActive() != null && !promotion.getIsActive()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Khuyến mãi '" + promotion.getName() + "' đã ngừng hoạt động");
        }
        if (promotion.getEffective() != null && now.isBefore(promotion.getEffective())) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Khuyến mãi '" + promotion.getName() + "' chưa đến thời gian áp dụng");
        }
        if (promotion.getExpiration() != null && now.isAfter(promotion.getExpiration())) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Khuyến mãi '" + promotion.getName() + "' đã hết hạn");
        }
        if (promotion.getQuantity() != null && promotion.getQuantity() <= 0) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Khuyến mãi '" + promotion.getName() + "' đã hết lượt sử dụng");
        }
        if (promotion.getMinOrderValue() != null && subtotal.compareTo(promotion.getMinOrderValue()) < 0) {
            throw new AppException(ErrorCode.VALIDATION_ERROR,
                    "Đơn hàng chưa đạt giá trị tối thiểu " + promotion.getMinOrderValue() + "đ để dùng khuyến mãi '" + promotion.getName() + "'");
        }
    }

    private BigDecimal calculatePromoDiscount(BigDecimal subtotal, Promotion promotion) {
        if (promotion instanceof PercentPromotion pp) {
            BigDecimal discount = subtotal.multiply(BigDecimal.valueOf(pp.getPercent() / 100.0));
            BigDecimal maxDiscount = BigDecimal.valueOf(pp.getMaxDiscount());
            if (maxDiscount.compareTo(BigDecimal.ZERO) > 0 && discount.compareTo(maxDiscount) > 0) {
                return maxDiscount;
            }
            return discount;
        } else if (promotion instanceof AmountPromotion ap) {
            return BigDecimal.valueOf(ap.getDiscount());
        }
        return BigDecimal.ZERO;
    }

    private BigDecimal calculatePromotionBase(Set<OrderItem> orderItems, BigDecimal subtotal, Promotion promotion) {
        if (!"ITEM".equalsIgnoreCase(promotion.getApplyScope())) {
            return subtotal;
        }
        String targetType = promotion.getTargetType();
        String targetId = promotion.getTargetId();
        if (targetType == null || targetId == null || targetType.isBlank() || targetId.isBlank()) {
            return BigDecimal.ZERO;
        }
        return orderItems.stream()
                .filter(item -> promotionMatchesItem(item, targetType, targetId))
                .map(OrderItem::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private String shortOrderCode(String orderId) {
        if (orderId == null || orderId.isBlank()) {
            return "DH";
        }
        String compact = orderId.replace("-", "").toUpperCase(Locale.ROOT);
        return "DH-" + compact.substring(0, Math.min(8, compact.length()));
    }

    private boolean promotionMatchesItem(OrderItem item, String targetType, String targetId) {
        return switch (targetType.toUpperCase()) {
            case "PRODUCT" -> item.getProduct() != null && targetId.equals(item.getProduct().getProductId());
            case "SERVICE" -> item.getService() != null && targetId.equals(item.getService().getServiceId());
            case "PACKAGE" -> item.getTreatmentPackage() != null && targetId.equals(item.getTreatmentPackage().getTreatmentPackageId());
            default -> false;
        };
    }

    private ServiceSchedule validateServiceSchedule(OrderItemRequest itemReq, fit.quanlyspa.entity.Service service, Customer customer, String excludeAppointmentId) {
        if (itemReq.getScheduledDateTime() == null) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Can chon thoi gian phuc vu cho dich vu");
        }
        if (itemReq.getTherapistId() == null || itemReq.getTherapistId().isBlank()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Can chon ky thuat vien cho dich vu");
        }

        Employee therapist = employeeRepository.findById(itemReq.getTherapistId())
                .orElseThrow(() -> new AppException(ErrorCode.EMPLOYEE_NOT_FOUND, "Ky thuat vien khong ton tai"));
        return validateServiceSchedule(itemReq.getScheduledDateTime(), service, customer, therapist, itemReq.getRoomId(), excludeAppointmentId);
    }

    private ServiceSchedule validateStoredServiceSchedule(OrderItem item, Customer customer, Appointment sourceAppointment) {
        if (item.getScheduledDateTime() == null) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Don hang thieu thoi gian phuc vu cho dich vu");
        }
        if (item.getScheduledTherapist() == null) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Don hang thieu ky thuat vien cho dich vu");
        }
        String roomId = item.getScheduledRoom() == null ? null : item.getScheduledRoom().getRoomId();
        String excludeAppointmentId = sourceAppointment == null ? null : sourceAppointment.getAppointmentId();
        return validateServiceSchedule(item.getScheduledDateTime(), item.getService(), customer, item.getScheduledTherapist(), roomId, excludeAppointmentId);
    }

    private ServiceSchedule validateServiceSchedule(
            LocalDateTime startTime,
            fit.quanlyspa.entity.Service service,
            Customer customer,
            Employee therapist,
            String roomId,
            String excludeAppointmentId
    ) {
        if (service.getStatusOfService() != StatusOfService.ACTIVE) {
            throw new AppException(ErrorCode.SERVICE_INACTIVE, "Dich vu khong con hoat dong");
        }
        if (therapist.getStatusOfEmployee() != StatusOfEmployee.ACTIVE) {
            throw new AppException(ErrorCode.EMPLOYEE_INACTIVE, "Ky thuat vien khong con hoat dong");
        }
        if (therapist.getServiceSkills() != null && !therapist.getServiceSkills().isEmpty()
                && therapist.getServiceSkills().stream().noneMatch(skill -> skill.getServiceId().equals(service.getServiceId()))) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Ky thuat vien chua duoc cap ky nang cho dich vu nay");
        }
        if (therapist.getWorkDays() != null && !therapist.getWorkDays().isEmpty()
                && !therapist.getWorkDays().contains(startTime.getDayOfWeek())) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Ky thuat vien khong co ca lam trong ngay da chon");
        }
        LocalDateTime endTime = startTime.plusMinutes((long) service.getDuration());
        // ISS-001: giờ dịch vụ phải nằm trong khung giờ mở cửa của spa
        if (!businessHours.isWithinBusinessHours(startTime.toLocalTime(), endTime.toLocalTime())) {
            throw new AppException(ErrorCode.VALIDATION_ERROR,
                    String.format("Khung giờ dịch vụ phải nằm trong giờ mở cửa (%s - %s)",
                            businessHours.getOpeningTime(), businessHours.getClosingTime()));
        }
        if (therapist.getShiftStart() != null && therapist.getShiftEnd() != null
                && (startTime.toLocalTime().isBefore(therapist.getShiftStart())
                || endTime.toLocalTime().isAfter(therapist.getShiftEnd()))) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Khung gio nam ngoai ca lam cua ky thuat vien");
        }
        if (!appointmentRepository.findOverlappingForCustomer(customer.getCustomerId(), startTime, endTime, excludeAppointmentId).isEmpty()) {
            throw new AppException(ErrorCode.APPOINTMENT_TIME_CONFLICT);
        }
        int buffer = businessHours.getBufferMinutes();
        if (!appointmentRepository.findTherapistConflicts(therapist.getEmployeeId(),
                startTime.minusMinutes(buffer), endTime.plusMinutes(buffer), excludeAppointmentId).isEmpty()) {
            throw new AppException(ErrorCode.APPOINTMENT_THERAPIST_CONFLICT, "Ky thuat vien da co lich trong khung gio nay");
        }

        Room room = null;
        if (roomId != null && !roomId.isBlank()) {
            room = roomRepository.findById(roomId)
                    .orElseThrow(() -> new AppException(ErrorCode.ROOM_NOT_FOUND, "Phong khong ton tai"));
            if (room.getStatus() != RoomStatus.AVAILABLE) {
                throw new AppException(ErrorCode.ROOM_INACTIVE, "Phong khong kha dung");
            }
            if (!appointmentRepository.findRoomConflicts(room.getRoomId(),
                    startTime.minusMinutes(buffer), endTime.plusMinutes(buffer), excludeAppointmentId).isEmpty()) {
                throw new AppException(ErrorCode.APPOINTMENT_ROOM_CONFLICT, "Phong da duoc dat trong khung gio nay");
            }
        }

        return new ServiceSchedule(startTime, endTime, therapist, room);
    }

    private BigDecimal calculateVoucherDiscount(BigDecimal amountAfterPromo, Voucher voucher) {
        if ("PERCENT".equals(voucher.getVoucherType())) {
            BigDecimal discount = amountAfterPromo.multiply(voucher.getDiscountValue().divide(BigDecimal.valueOf(100)));
            if (voucher.getMaxDiscount() != null && discount.compareTo(voucher.getMaxDiscount()) > 0) {
                return voucher.getMaxDiscount();
            }
            return discount;
        }
        // Voucher tien mat khong duoc giam qua gia tri con lai cua don
        return voucher.getDiscountValue().min(amountAfterPromo.max(BigDecimal.ZERO));
    }

    private OrderResponse toOrderResponse(Order order) {
        List<OrderItemResponse> items = order.getOrderItems().stream().map(item -> {
            OrderItemResponse.OrderItemResponseBuilder resp = OrderItemResponse.builder()
                    .orderItemId(item.getOrderItemId())
                    .itemType(item.getItemType())
                    .quantity(item.getQuantity())
                    .unitPrice(item.getUnitPrice())
                    .amount(item.getAmount());

            if (item.getItemType() == OrderItemType.PRODUCT && item.getProduct() != null) {
                resp.productId(item.getProduct().getProductId())
                    .productName(item.getProduct().getName())
                    .productSku(item.getProduct().getSku());
            } else if (item.getItemType() == OrderItemType.SERVICE && item.getService() != null) {
                resp.serviceId(item.getService().getServiceId())
                    .serviceName(item.getService().getName());
            } else if (item.getItemType() == OrderItemType.PACKAGE && item.getTreatmentPackage() != null) {
                resp.packageId(item.getTreatmentPackage().getTreatmentPackageId())
                    .packageName(item.getTreatmentPackage().getPackageName());
            }
            return resp.build();
        }).collect(Collectors.toList());

        List<OrderResponse.PaymentSummaryResponse> payments = paymentRepository.findByOrderId(order.getOrderId()).stream().map(p ->
            OrderResponse.PaymentSummaryResponse.builder()
                    .paymentId(p.getPaymentId())
                    .amount(p.getAmount())
                    .paymentMethod(p.getPaymentMethod().name())
                    .status(p.getStatus().name())
                    .transactionReference(p.getTransactionReference())
                    .changeAmount(p.getChangeAmount())
                    .processedAt(p.getProcessedAt())
                    .build()
        ).collect(Collectors.toList());

        return OrderResponse.builder()
                .orderId(order.getOrderId())
                .displayCode(order.getDisplayCode())
                .orderStatus(order.getOrderStatus())
                .typeOfOrder(order.getTypeOfOrder())
                .subtotal(order.getSubtotal())
                .promoDiscount(order.getPromoDiscount())
                .voucherDiscount(order.getVoucherDiscount())
                .membershipDiscount(order.getMembershipDiscount())
                .loyaltyDiscount(order.getLoyaltyDiscount() == null ? BigDecimal.ZERO : order.getLoyaltyDiscount())
                .loyaltyPointsUsed(order.getLoyaltyPointsUsed() == null ? 0 : order.getLoyaltyPointsUsed())
                .taxAmount(order.getTaxAmount())
                .totalAmount(order.getTotalAmount())
                .paidAmount(order.getPaidAmount())
                .remainingAmount(order.getRemainingAmount())
                .appointmentId(order.getAppointment() != null ? order.getAppointment().getAppointmentId() : null)
                .appointmentDisplayCode(order.getAppointment() != null ? order.getAppointment().getDisplayCode() : null)
                .customerId(order.getCustomer().getCustomerId())
                .customerDisplayCode(order.getCustomer().getDisplayCode())
                .customerName(order.getCustomer().getName())
                .customerPhone(order.getCustomer().getPhone())
                .createdBy(order.getCreatedBy())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .orderItems(items)
                .payments(payments)
                .build();
    }

    private record ServiceSchedule(LocalDateTime startTime, LocalDateTime endTime, Employee therapist, Room room) {
    }
}
