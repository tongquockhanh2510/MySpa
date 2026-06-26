package fit.quanlyspa.service;

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

    // ===== STEP 1, 2, 3: CREATE ORDER DRAFT =====
    @Transactional
    public OrderResponse createOrder(OrderRequest request, String createdBy) {
        Customer customer;

        // STEP 1 - CUSTOMER SELECTION
        if (request.getCustomerId() != null && !request.getCustomerId().isBlank()) {
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
                .customer(customer)
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
            BigDecimal promotionBase = calculatePromotionBase(orderItems, subtotal, promotion);
            promoDiscount = calculatePromoDiscount(promotionBase, promotion);
            order.setPromoDiscount(promoDiscount);
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

        // D. Tax (e.g. 10% VAT, optional)
        BigDecimal taxableAmount = subtotal.subtract(promoDiscount).subtract(voucherDiscount).subtract(membershipDiscount);
        if (taxableAmount.compareTo(BigDecimal.ZERO) < 0) taxableAmount = BigDecimal.ZERO;
        
        BigDecimal taxAmount = taxableAmount.multiply(BigDecimal.valueOf(0.10)).setScale(2, RoundingMode.HALF_UP); // 10% tax
        order.setTaxAmount(taxAmount);

        // E. Final Amount & Grand Total
        BigDecimal totalAmount = taxableAmount.add(taxAmount).setScale(2, RoundingMode.HALF_UP);
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
        if (request.getAmount().compareTo(order.getRemainingAmount()) > 0) {
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
            
            // Execute Post-payment workflows
            executePostPaymentFlows(order, processedBy);
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
            }
            
            // STEP 6: SERVICE PURCHASE FLOW (Auto create appointments)
            else if (item.getItemType() == OrderItemType.SERVICE && item.getService() != null) {
                // Check if default scheduling dates were provided, otherwise schedule for tomorrow
                LocalDateTime bookingTime = LocalDateTime.now().plusDays(1).withHour(10).withMinute(0); 
                Employee therapist = employeeRepository.findAll().stream().filter(e -> e.getStatusOfEmployee() == StatusOfEmployee.ACTIVE).findFirst().orElse(null);
                Room room = roomRepository.findAll().stream().filter(r -> r.getStatus() == RoomStatus.AVAILABLE).findFirst().orElse(null);

                Appointment appointment = Appointment.builder()
                        .customer(customer)
                        .dateTime(bookingTime)
                        .endTime(bookingTime.plusMinutes((long) item.getService().getDuration()))
                        .statusOfAppointment(StatusOfAppointment.CONFIRMED)
                        .createdBy(processedBy)
                        .room(room)
                        .note("Tự động tạo từ đơn hàng " + order.getOrderId())
                        .build();

                appointment = appointmentRepository.save(appointment);

                AppoinmentDetail detail = new AppoinmentDetail();
                detail.setId(new AppoimentDetalId(appointment.getAppointmentId(), item.getService().getServiceId(), therapist != null ? therapist.getEmployeeId() : ""));
                detail.setAppointment(appointment);
                detail.setService(item.getService());
                detail.setEmployee(therapist);
                detail.setPrice(item.getService().getPrice());
                appointmentDetailRepository.save(detail);
                
                log.info("Auto-created Confirmed Appointment {} for service {}", appointment.getAppointmentId(), item.getService().getName());
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
            }
        }

        // STEP 11: LOYALTY POINTS (100,000 VND = 1 Point)
        double pointsEarned = order.getTotalAmount().divide(BigDecimal.valueOf(100000), 2, RoundingMode.DOWN).doubleValue();
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
    }

    private void generateInvoiceFromOrder(Order order, String createdBy) {
        Invoice invoice = Invoice.builder()
                .invoiceNumber("INV-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "-" + String.format("%04d", (int)(Math.random() * 9999) + 1))
                .customer(order.getCustomer())
                .status(InvoiceStatus.PAID)
                .subtotal(order.getSubtotal())
                .discountAmount(order.getPromoDiscount().add(order.getVoucherDiscount()).add(order.getMembershipDiscount()))
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

    // ===== CALCULATION HELPER METHODS =====
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

    private boolean promotionMatchesItem(OrderItem item, String targetType, String targetId) {
        return switch (targetType.toUpperCase()) {
            case "PRODUCT" -> item.getProduct() != null && targetId.equals(item.getProduct().getProductId());
            case "SERVICE" -> item.getService() != null && targetId.equals(item.getService().getServiceId());
            case "PACKAGE" -> item.getTreatmentPackage() != null && targetId.equals(item.getTreatmentPackage().getTreatmentPackageId());
            default -> false;
        };
    }

    private BigDecimal calculateVoucherDiscount(BigDecimal amountAfterPromo, Voucher voucher) {
        if ("PERCENT".equals(voucher.getVoucherType())) {
            BigDecimal discount = amountAfterPromo.multiply(voucher.getDiscountValue().divide(BigDecimal.valueOf(100)));
            if (voucher.getMaxDiscount() != null && discount.compareTo(voucher.getMaxDiscount()) > 0) {
                return voucher.getMaxDiscount();
            }
            return discount;
        } else {
            return voucher.getDiscountValue();
        }
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
                    .processedAt(p.getProcessedAt())
                    .build()
        ).collect(Collectors.toList());

        return OrderResponse.builder()
                .orderId(order.getOrderId())
                .orderStatus(order.getOrderStatus())
                .typeOfOrder(order.getTypeOfOrder())
                .subtotal(order.getSubtotal())
                .promoDiscount(order.getPromoDiscount())
                .voucherDiscount(order.getVoucherDiscount())
                .membershipDiscount(order.getMembershipDiscount())
                .taxAmount(order.getTaxAmount())
                .totalAmount(order.getTotalAmount())
                .paidAmount(order.getPaidAmount())
                .remainingAmount(order.getRemainingAmount())
                .customerId(order.getCustomer().getCustomerId())
                .customerName(order.getCustomer().getName())
                .customerPhone(order.getCustomer().getPhone())
                .createdBy(order.getCreatedBy())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .orderItems(items)
                .payments(payments)
                .build();
    }
}
