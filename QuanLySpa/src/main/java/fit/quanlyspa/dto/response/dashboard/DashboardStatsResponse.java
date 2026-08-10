package fit.quanlyspa.dto.response.dashboard;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class DashboardStatsResponse {

    // Revenue KPIs
    BigDecimal todayRevenue;
    BigDecimal monthRevenue;          // Doanh thu ghi nhận (hóa đơn đã thanh toán đủ)
    BigDecimal yearRevenue;
    Double revenueGrowthPercent; // null = khong co du lieu thang truoc de so sanh
    Double todayRevenueGrowthPercent; // compared with the same weekday last week

    // ISS-012: phân biệt rõ các loại doanh thu
    BigDecimal monthCollected;        // Tiền thực thu trong tháng (gồm cả thanh toán một phần)
    BigDecimal unearnedRevenue;       // Doanh thu chưa thực hiện (buổi gói đã bán, chưa dùng)

    // Appointment KPIs
    long todayAppointments;
    long monthAppointments;
    long pendingAppointments;
    double cancellationRatePercent;

    // Customer KPIs
    long totalCustomers;
    long newCustomersThisMonth;
    Double customerGrowthPercent; // null = khong co du lieu thang truoc de so sanh

    // Employee KPIs
    long activeEmployees;
    long totalEmployees;

    // Package KPIs
    long activePackages;
    long soldPackagesThisMonth;

    // Inventory KPIs
    long lowStockProducts;

    // Recent data
    List<MonthlyRevenueResponse> monthlyRevenue;
    List<PopularServiceResponse> popularServices;
    List<TopEmployeeResponse> topEmployees;
    List<LowStockResponse> lowStockItems;
}
