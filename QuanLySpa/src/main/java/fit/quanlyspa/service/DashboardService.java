package fit.quanlyspa.service;

import fit.quanlyspa.dto.response.dashboard.*;
import fit.quanlyspa.enums.StatusOfEmployee;
import fit.quanlyspa.repository.*;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class DashboardService {

    InvoiceRepository invoiceRepository;
    AppointmentRepository appointmentRepository;
    CustomerRepository customerRepository;
    EmployeeRepository employeeRepository;
    ProductRepository productRepository;
    CustomerTreatmentRepository customerTreatmentRepository;
    CommissionRepository commissionRepository;
    PaymentRepository paymentRepository;

    @Transactional(readOnly = true)
    public DashboardStatsResponse getStats(Integer reportYear) {
        LocalDateTime now = LocalDateTime.now();
        int currentMonth = now.getMonthValue();
        int currentYear = reportYear != null ? reportYear : now.getYear();
        int prevMonth = currentMonth == 1 ? 12 : currentMonth - 1;
        int prevYear = currentMonth == 1 ? currentYear - 1 : currentYear;

        // Revenue KPIs
        BigDecimal todayRevenue = invoiceRepository.getTodayRevenue();
        LocalDate previousWeekDay = now.toLocalDate().minusWeeks(1);
        BigDecimal previousWeekDayRevenue = invoiceRepository.getRevenueBetween(
                previousWeekDay.atStartOfDay(), previousWeekDay.plusDays(1).atStartOfDay());
        Double todayRevenueGrowth = previousWeekDayRevenue.compareTo(BigDecimal.ZERO) > 0
                ? todayRevenue.subtract(previousWeekDayRevenue)
                    .divide(previousWeekDayRevenue, 4, java.math.RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100)).doubleValue()
                : null;
        BigDecimal monthRevenue = invoiceRepository.getMonthlyRevenue(currentMonth, currentYear);
        BigDecimal prevMonthRevenue = invoiceRepository.getMonthlyRevenue(prevMonth, prevYear);
        // ISS-012: tiền thực thu (gồm thanh toán một phần) & doanh thu chưa thực hiện
        BigDecimal monthCollected = paymentRepository.getCollectedInMonth(currentMonth, currentYear);
        BigDecimal unearnedRevenue = BigDecimal.valueOf(customerTreatmentRepository.sumUnearnedRevenue());
        BigDecimal yearRevenue = invoiceRepository.getMonthlyRevenue(1, currentYear)
                .add(invoiceRepository.getMonthlyRevenue(2, currentYear))
                .add(invoiceRepository.getMonthlyRevenue(3, currentYear))
                .add(invoiceRepository.getMonthlyRevenue(4, currentYear))
                .add(invoiceRepository.getMonthlyRevenue(5, currentYear))
                .add(invoiceRepository.getMonthlyRevenue(6, currentYear))
                .add(invoiceRepository.getMonthlyRevenue(7, currentYear))
                .add(invoiceRepository.getMonthlyRevenue(8, currentYear))
                .add(invoiceRepository.getMonthlyRevenue(9, currentYear))
                .add(invoiceRepository.getMonthlyRevenue(10, currentYear))
                .add(invoiceRepository.getMonthlyRevenue(11, currentYear))
                .add(invoiceRepository.getMonthlyRevenue(12, currentYear));

        // null = thang truoc chua co doanh thu, khong the so sanh (tranh hien thi +0%/-100% gay hieu nham)
        Double revenueGrowth = null;
        if (prevMonthRevenue.compareTo(BigDecimal.ZERO) > 0) {
            revenueGrowth = monthRevenue.subtract(prevMonthRevenue)
                    .divide(prevMonthRevenue, 4, java.math.RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100)).doubleValue();
        }

        // Appointment KPIs
        long todayAppts = appointmentRepository.countTodayAppointments();
        long monthAppts = appointmentRepository.countCompletedByMonth(currentYear).stream()
                .filter(r -> ((Number) r[0]).intValue() == currentMonth)
                .mapToLong(r -> ((Number) r[1]).longValue()).sum();
        long cancelledThisMonth = appointmentRepository.countCancelledByMonth(currentMonth, currentYear);
        long totalThisMonth = monthAppts + cancelledThisMonth;
        double cancellationRate = totalThisMonth > 0 ? (double) cancelledThisMonth / totalThisMonth * 100 : 0;

        // Customer KPIs
        long totalCustomers = customerRepository.count();
        long newCustomers = customerRepository.countNewCustomersByMonth(currentMonth, currentYear);
        long prevNewCustomers = customerRepository.countNewCustomersByMonth(prevMonth, prevYear);
        Double customerGrowth = prevNewCustomers > 0 ? (double)(newCustomers - prevNewCustomers) / prevNewCustomers * 100 : null;

        // Employee KPIs
        long activeEmployees = employeeRepository.countRealEmployeesByStatus(StatusOfEmployee.ACTIVE);
        long totalEmployees = employeeRepository.findRealEmployees().size();

        // Low stock
        long lowStockCount = productRepository.findLowStockProducts().size();
        List<LowStockResponse> lowStockItems = productRepository.findLowStockProducts().stream()
                .limit(5)
                .map(p -> LowStockResponse.builder()
                        .productId(p.getProductId())
                        .productName(p.getName())
                        .brand(p.getBrand())
                        .currentStock(p.getInventory() != null ? p.getInventory().getQuantityInStock() : p.getStockQuantity())
                        .minStockLevel(p.getMinStockLevel())
                        .unit(p.getUnit())
                        .build())
                .toList();

        long activePackages = customerTreatmentRepository.findActiveByCustomer(LocalDate.now()).size();
        long soldPackagesThisMonth = customerTreatmentRepository.countSoldByMonth(currentMonth, currentYear);

        // Monthly Revenue & Profit Chart
        java.util.Map<Integer, BigDecimal> monthlyCost = new java.util.HashMap<>();
        for (Object[] r : invoiceRepository.getMonthlyCostBreakdown(currentYear)) {
            monthlyCost.put(((Number) r[0]).intValue(), BigDecimal.valueOf(((Number) r[1]).doubleValue()));
        }
        List<Object[]> monthlyRaw = invoiceRepository.getMonthlyRevenueBreakdown(currentYear);
        List<MonthlyRevenueResponse> monthlyRevenue = monthlyRaw.stream()
                .map(r -> {
                    int month = ((Number) r[0]).intValue();
                    BigDecimal revenue = (BigDecimal) r[1];
                    BigDecimal cost = monthlyCost.getOrDefault(month, BigDecimal.ZERO);
                    return MonthlyRevenueResponse.builder()
                            .month(month)
                            .year(currentYear)
                            .revenue(revenue)
                            .cost(cost)
                            .profit(revenue.subtract(cost))
                            .orderCount(((Number) r[2]).longValue())
                            .build();
                })
                .toList();

        // Popular Services
        List<Object[]> serviceRaw = invoiceRepository.getRevenueByService(currentMonth, currentYear);
        List<PopularServiceResponse> popularServices = serviceRaw.stream()
                .limit(5)
                .map(r -> PopularServiceResponse.builder()
                        .serviceName((String) r[0])
                        .totalRevenue((BigDecimal) r[1])
                        .bookingCount(((Number) r[2]).longValue())
                        .build())
                .toList();

        // Top Employees (theo doanh thu dich vu/goi da tao hoa hong trong nam)
        List<TopEmployeeResponse> topEmployees = commissionRepository.getTopEmployeesByYear(currentYear).stream()
                .limit(10)
                .map(r -> TopEmployeeResponse.builder()
                        .employeeId((String) r[0])
                        .employeeName((String) r[1])
                        .position(r[2] != null ? String.valueOf(r[2]) : null)
                        .appointmentCount(((Number) r[3]).longValue())
                        .totalRevenue(BigDecimal.valueOf(((Number) r[4]).doubleValue()))
                        .totalCommission(((Number) r[5]).doubleValue())
                        .build())
                .toList();

        return DashboardStatsResponse.builder()
                .todayRevenue(todayRevenue)
                .monthRevenue(monthRevenue)
                .yearRevenue(yearRevenue)
                .revenueGrowthPercent(revenueGrowth)
                .todayRevenueGrowthPercent(todayRevenueGrowth)
                .monthCollected(monthCollected)
                .unearnedRevenue(unearnedRevenue)
                .todayAppointments(todayAppts)
                .monthAppointments(monthAppts)
                .cancellationRatePercent(cancellationRate)
                .totalCustomers(totalCustomers)
                .newCustomersThisMonth(newCustomers)
                .customerGrowthPercent(customerGrowth)
                .activeEmployees(activeEmployees)
                .totalEmployees(totalEmployees)
                .activePackages(activePackages)
                .soldPackagesThisMonth(soldPackagesThisMonth)
                .lowStockProducts(lowStockCount)
                .monthlyRevenue(monthlyRevenue)
                .popularServices(popularServices)
                .topEmployees(topEmployees)
                .lowStockItems(lowStockItems)
                .build();
    }

    // Doanh thu theo ngay trong 1 thang
    @Transactional(readOnly = true)
    public List<java.util.Map<String, Object>> getDailyRevenue(int month, int year) {
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDateTime from = start.atStartOfDay();
        LocalDateTime to = start.plusMonths(1).atStartOfDay();

        java.util.Map<LocalDate, Object[]> byDate = new java.util.HashMap<>();
        for (Object[] r : invoiceRepository.getDailyRevenue(from, to)) {
            LocalDate date = r[0] instanceof LocalDate d ? d : ((java.sql.Date) r[0]).toLocalDate();
            byDate.put(date, r);
        }

        List<java.util.Map<String, Object>> result = new ArrayList<>();
        for (LocalDate date = start; date.isBefore(start.plusMonths(1)); date = date.plusDays(1)) {
            Object[] r = byDate.get(date);
            java.util.Map<String, Object> row = new java.util.LinkedHashMap<>();
            row.put("date", date.toString());
            row.put("revenue", r != null ? r[1] : BigDecimal.ZERO);
            row.put("orderCount", r != null ? ((Number) r[2]).longValue() : 0L);
            result.add(row);
        }
        return result;
    }

    // San pham ban chay (theo thang hoac ca nam)
    @Transactional(readOnly = true)
    public List<java.util.Map<String, Object>> getTopProducts(Integer month, int year) {
        LocalDateTime from;
        LocalDateTime to;
        if (month != null) {
            LocalDate start = LocalDate.of(year, month, 1);
            from = start.atStartOfDay();
            to = start.plusMonths(1).atStartOfDay();
        } else {
            from = LocalDate.of(year, 1, 1).atStartOfDay();
            to = LocalDate.of(year + 1, 1, 1).atStartOfDay();
        }

        return invoiceRepository.getTopProducts(from, to).stream()
                .limit(10)
                .map(r -> {
                    java.util.Map<String, Object> row = new java.util.LinkedHashMap<>();
                    row.put("productName", r[0]);
                    row.put("quantitySold", ((Number) r[1]).longValue());
                    row.put("totalRevenue", r[2]);
                    return row;
                })
                .toList();
    }
}
