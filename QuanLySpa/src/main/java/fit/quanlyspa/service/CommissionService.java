package fit.quanlyspa.service;

import fit.quanlyspa.dto.response.salary.CommissionDetailResponse;
import fit.quanlyspa.dto.response.salary.EmployeeSalaryResponse;
import fit.quanlyspa.entity.*;
import fit.quanlyspa.enums.CommissionType;
import fit.quanlyspa.enums.OrderItemType;
import fit.quanlyspa.enums.OrderStatus;
import fit.quanlyspa.enums.StatusOfAppointment;
import fit.quanlyspa.enums.StatusOfEmployee;
import fit.quanlyspa.exception.AppException;
import fit.quanlyspa.exception.ErrorCode;
import fit.quanlyspa.repository.AppointmentRepository;
import fit.quanlyspa.repository.CommissionRepository;
import fit.quanlyspa.repository.EmployeeRepository;
import fit.quanlyspa.repository.OrderRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CommissionService {

    CommissionRepository commissionRepository;
    EmployeeRepository employeeRepository;
    AppointmentRepository appointmentRepository;
    OrderRepository orderRepository;

    // ===== GENERATION =====

    /**
     * Sinh hoa hồng cho từng kỹ thuật viên khi một lịch hẹn dịch vụ lẻ hoàn thành.
     * Mỗi dòng dịch vụ (AppoinmentDetail) tạo 1 bản ghi hoa hồng cho người thực hiện.
     */
    @Transactional
    public void generateForCompletedAppointment(Appointment appointment) {
        if (appointment == null || appointment.getDetails() == null) {
            return;
        }
        String referenceId = appointment.getAppointmentId();
        if (commissionRepository.existsByReferenceIdAndCommissionType(referenceId, CommissionType.SERVICE)) {
            return; // đã sinh hoa hồng cho lịch hẹn này
        }

        // Dùng ngày hoàn thành thực tế để tính kỳ hoa hồng (fallback hôm nay)
        LocalDate eventDate = appointment.getCompletedAt() != null
                ? appointment.getCompletedAt().toLocalDate()
                : LocalDate.now();
        String customerName = appointment.getCustomer() != null ? appointment.getCustomer().getName() : "";

        for (AppoinmentDetail detail : appointment.getDetails()) {
            Employee employee = detail.getEmployee();
            double fraction = normalizeFraction(employee != null ? employee.getCommissionRate() : 0);
            if (employee == null || fraction <= 0) {
                continue;
            }
            double base = detail.getPrice();
            String serviceName = detail.getService() != null ? detail.getService().getName() : "Dịch vụ";

            Commission commission = Commission.builder()
                    .employee(employee)
                    .commissionType(CommissionType.SERVICE)
                    .baseAmount(base)
                    .commissionRate(fraction * 100)
                    .commissionAmount(base * fraction)
                    .month(eventDate.getMonthValue())
                    .year(eventDate.getYear())
                    .referenceId(referenceId)
                    .description("Hoa hồng dịch vụ '" + serviceName + "' - KH " + customerName)
                    .build();
            commissionRepository.save(commission);
            log.info("Generated SERVICE commission {} for employee {} on appointment {}",
                    commission.getCommissionAmount(), employee.getName(), referenceId);
        }
    }

    /**
     * Sinh hoa hồng cho người phụ trách gói khi gói liệu trình được bán (đơn đã thanh toán).
     */
    @Transactional
    public void generateForPackageSale(Order order, OrderItem item) {
        TreatmentPackage pack = item.getTreatmentPackage();
        if (pack == null) {
            return;
        }
        Employee seller = pack.getEmployee() != null ? pack.getEmployee() : item.getScheduledTherapist();
        double fraction = normalizeFraction(seller != null ? seller.getCommissionRate() : 0);
        if (seller == null || fraction <= 0) {
            return;
        }

        String referenceId = order.getOrderId() + ":" + pack.getTreatmentPackageId();
        if (commissionRepository.existsByReferenceIdAndCommissionType(referenceId, CommissionType.PACKAGE)) {
            return;
        }

        double base = item.getAmount() != null ? item.getAmount().doubleValue() : pack.getPackagePrice();
        // Dùng ngày thanh toán đơn (updatedAt khi chuyển PAID) để tính kỳ hoa hồng
        LocalDate eventDate = order.getUpdatedAt() != null ? order.getUpdatedAt().toLocalDate()
                : (order.getCreatedAt() != null ? order.getCreatedAt().toLocalDate() : LocalDate.now());
        String customerName = order.getCustomer() != null ? order.getCustomer().getName() : "";

        Commission commission = Commission.builder()
                .employee(seller)
                .commissionType(CommissionType.PACKAGE)
                .baseAmount(base)
                .commissionRate(fraction * 100)
                .commissionAmount(base * fraction)
                .month(eventDate.getMonthValue())
                .year(eventDate.getYear())
                .referenceId(referenceId)
                .description("Hoa hồng bán gói '" + pack.getPackageName() + "' - KH " + customerName)
                .build();
        commissionRepository.save(commission);
        log.info("Generated PACKAGE commission {} for employee {} on order {}",
                commission.getCommissionAmount(), seller.getName(), order.getOrderId());
    }

    /**
     * Sinh bù hoa hồng cho dữ liệu cũ: tất cả lịch hẹn đã COMPLETED và các gói đã bán
     * trong đơn đã thanh toán. Idempotent — bỏ qua bản ghi đã có hoa hồng.
     *
     * @return số bản ghi hoa hồng được tạo mới
     */
    @Transactional
    public int backfill() {
        long before = commissionRepository.count();

        appointmentRepository.findByStatusOfAppointment(StatusOfAppointment.COMPLETED)
                .forEach(this::generateForCompletedAppointment);

        for (Order order : orderRepository.findByOrderStatus(OrderStatus.PAID)) {
            for (OrderItem item : order.getOrderItems()) {
                if (item.getItemType() == OrderItemType.PACKAGE && item.getTreatmentPackage() != null) {
                    generateForPackageSale(order, item);
                }
            }
        }

        int created = (int) (commissionRepository.count() - before);
        log.info("Commission backfill created {} new records", created);
        return created;
    }

    // ===== QUERIES =====

    @Transactional(readOnly = true)
    public List<EmployeeSalaryResponse> getSalarySummary(int month, int year) {
        return employeeRepository.findAll().stream()
                .filter(e -> e.getStatusOfEmployee() == StatusOfEmployee.ACTIVE)
                .map(employee -> toSalaryResponse(employee, month, year))
                .sorted(Comparator.comparing(EmployeeSalaryResponse::getEmployeeName))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public EmployeeSalaryResponse getMySalarySummary(String username, int month, int year) {
        Employee employee = employeeRepository.findByUser_UserName(username)
                .orElseThrow(() -> new AppException(ErrorCode.EMPLOYEE_NOT_FOUND,
                        "Tai khoan hien tai chua lien ket voi ho so nhan vien"));
        return toSalaryResponse(employee, month, year);
    }

    @Transactional(readOnly = true)
    public List<CommissionDetailResponse> getCommissionDetails(String employeeId, int month, int year) {
        return commissionRepository.findByEmployeeAndPeriod(employeeId, month, year).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CommissionDetailResponse> getMyCommissionDetails(String username, int month, int year) {
        Employee employee = employeeRepository.findByUser_UserName(username)
                .orElseThrow(() -> new AppException(ErrorCode.EMPLOYEE_NOT_FOUND,
                        "Tai khoan hien tai chua lien ket voi ho so nhan vien"));
        return getCommissionDetails(employee.getEmployeeId(), month, year);
    }

    private EmployeeSalaryResponse toSalaryResponse(Employee employee, int month, int year) {
        List<Commission> commissions = commissionRepository
                .findByEmployeeAndPeriod(employee.getEmployeeId(), month, year);
        double totalCommission = commissions.stream().mapToDouble(Commission::getCommissionAmount).sum();
        double baseSalary = employee.getBaseSalary();
        return EmployeeSalaryResponse.builder()
                .employeeId(employee.getEmployeeId())
                .employeeName(employee.getName())
                .position(employee.getPosition())
                .month(month)
                .year(year)
                .baseSalary(baseSalary)
                .totalCommission(totalCommission)
                .commissionCount(commissions.size())
                .totalSalary(baseSalary + totalCommission)
                .build();
    }

    private CommissionDetailResponse toResponse(Commission c) {
        return CommissionDetailResponse.builder()
                .commissionId(c.getCommissionId())
                .employeeId(c.getEmployee() != null ? c.getEmployee().getEmployeeId() : null)
                .employeeName(c.getEmployee() != null ? c.getEmployee().getName() : null)
                .commissionType(c.getCommissionType())
                .baseAmount(c.getBaseAmount())
                .commissionRate(c.getCommissionRate())
                .commissionAmount(c.getCommissionAmount())
                .referenceId(c.getReferenceId())
                .description(c.getDescription())
                .month(c.getMonth())
                .year(c.getYear())
                .paid(c.isPaid())
                .createdAt(c.getCreatedAt())
                .build();
    }

    /** Chuẩn hóa tỉ lệ về dạng phân số (0.10). Hỗ trợ cả khi nhập 10 (=10%). */
    private double normalizeFraction(double rate) {
        if (rate <= 0) {
            return 0;
        }
        return rate > 1 ? rate / 100.0 : rate;
    }
}
