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

    @Transactional(readOnly = true)
    public DashboardStatsResponse getStats(Integer reportYear) {
        LocalDateTime now = LocalDateTime.now();
        int currentMonth = now.getMonthValue();
        int currentYear = reportYear != null ? reportYear : now.getYear();
        int prevMonth = currentMonth == 1 ? 12 : currentMonth - 1;
        int prevYear = currentMonth == 1 ? currentYear - 1 : currentYear;

        // Revenue KPIs
        BigDecimal todayRevenue = invoiceRepository.getTodayRevenue();
        BigDecimal monthRevenue = invoiceRepository.getMonthlyRevenue(currentMonth, currentYear);
        BigDecimal prevMonthRevenue = invoiceRepository.getMonthlyRevenue(prevMonth, prevYear);
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

        double revenueGrowth = 0;
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
        double customerGrowth = prevNewCustomers > 0 ? (double)(newCustomers - prevNewCustomers) / prevNewCustomers * 100 : 0;

        // Employee KPIs
        long activeEmployees = employeeRepository.countByStatusOfEmployee(StatusOfEmployee.ACTIVE);
        long totalEmployees = employeeRepository.count();

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

        // Monthly Revenue Chart
        List<Object[]> monthlyRaw = invoiceRepository.getMonthlyRevenueBreakdown(currentYear);
        List<MonthlyRevenueResponse> monthlyRevenue = monthlyRaw.stream()
                .map(r -> MonthlyRevenueResponse.builder()
                        .month(((Number) r[0]).intValue())
                        .year(currentYear)
                        .revenue((BigDecimal) r[1])
                        .orderCount(((Number) r[2]).longValue())
                        .build())
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

        return DashboardStatsResponse.builder()
                .todayRevenue(todayRevenue)
                .monthRevenue(monthRevenue)
                .yearRevenue(yearRevenue)
                .revenueGrowthPercent(revenueGrowth)
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
                .lowStockItems(lowStockItems)
                .build();
    }
}
