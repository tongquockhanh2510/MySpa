package fit.quanlyspa.dto.response.order;

import fit.quanlyspa.enums.OrderStatus;
import fit.quanlyspa.enums.TypeOfOrder;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderResponse {
    String orderId;
    String displayCode;
    OrderStatus orderStatus;
    TypeOfOrder typeOfOrder;
    BigDecimal subtotal;
    BigDecimal promoDiscount;
    BigDecimal voucherDiscount;
    BigDecimal membershipDiscount;
    BigDecimal loyaltyDiscount;
    double loyaltyPointsUsed;
    BigDecimal taxAmount;
    BigDecimal totalAmount;
    BigDecimal paidAmount;
    BigDecimal remainingAmount;

    String appointmentId;
    String appointmentDisplayCode;

    String customerId;
    String customerDisplayCode;
    String customerName;
    String customerPhone;

    String createdBy;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;

    List<OrderItemResponse> orderItems;
    List<PaymentSummaryResponse> payments;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class PaymentSummaryResponse {
        String paymentId;
        BigDecimal amount;
        String paymentMethod;
        String status;
        String transactionReference;
        BigDecimal changeAmount;
        LocalDateTime processedAt;
    }
}
