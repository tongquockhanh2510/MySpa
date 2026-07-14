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
    BigDecimal monthRevenue;
    BigDecimal yearRevenue;
    Double revenueGrowthPercent; // null = khong co du lieu thang truoc de so sanh

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
