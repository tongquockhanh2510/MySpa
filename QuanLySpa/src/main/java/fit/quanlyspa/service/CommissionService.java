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
import fit.quanlyspa.repository.SalaryRepository;
import fit.quanlyspa.dto.request.salary.PayrollUpdateRequest;
import fit.quanlyspa.enums.PayrollStatus;
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
    SalaryRepository salaryRepository;

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
        // Dùng ngày hoàn thành thực tế để tính kỳ hoa hồng (fallback hôm nay)
        LocalDate eventDate = appointment.getCompletedAt() != null
                ? appointment.getCompletedAt().toLocalDate()
                : LocalDate.now();
        String customerName = appointment.getCustomer() != null ? appointment.getCustomer().getName() : "";

        for (AppoinmentDetail detail : appointment.getDetails()) {
            Employee employee = detail.getEmployee();
            fit.quanlyspa.entity.Service service = detail.getService();
            double configuredRate = service != null && service.getCommissionRate() > 0
                    ? service.getCommissionRate()
                    : (employee != null ? employee.getCommissionRate() : 0);
            double fraction = normalizeFraction(configuredRate);
            if (employee == null || fraction <= 0) {
                continue;
            }
            String referenceId = appointment.getAppointmentId() + ":"
                    + (service != null ? service.getServiceId() : "service") + ":"
                    + employee.getEmployeeId();
            if (commissionRepository.existsByReferenceIdAndCommissionType(referenceId, CommissionType.SERVICE)) {
                continue;
            }
            double base = detail.getPrice();
            String serviceName = service != null ? service.getName() : "Dịch vụ";

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
                    .customerName(customerName)
                    .serviceName(serviceName)
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
                .customerName(customerName)
                .serviceName(pack.getPackageName())
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

    // ===== REVERSAL (hồi tố khi hoàn/hủy đơn) =====

    /**
     * Sinh hoa hồng ÂM để hồi tố toàn bộ hoa hồng đã ghi nhận cho một đơn hàng
     * (hoa hồng bán gói theo orderId, hoa hồng dịch vụ theo lịch hẹn gắn với đơn).
     * KHÔNG xóa bản ghi gốc — giữ để truy vết. Idempotent: mỗi bản ghi gốc chỉ
     * bị đảo đúng một lần (referenceId gốc + ":REVERSAL").
     *
     * @return số bản ghi hoa hồng âm được tạo
     */
    @Transactional
    public int reverseForOrder(Order order) {
        if (order == null) {
            return 0;
        }
        LocalDate today = LocalDate.now();
        int reversed = reverseByPrefix(order.getOrderId() + ":", today);
        if (order.getAppointment() != null) {
            reversed += reverseByPrefix(order.getAppointment().getAppointmentId() + ":", today);
        }
        return reversed;
    }

    /**
     * ISS-006: hồi tố MỘT PHẦN hoa hồng bán gói khi khách quy đổi các buổi chưa dùng.
     * Sinh 1 bản ghi âm = -(hoa hồng gốc × tỉ lệ buổi chưa dùng). Idempotent theo
     * referenceId gốc + ":CONV_REVERSAL". Bỏ qua nếu không tìm được đơn nguồn.
     *
     * @return số bản ghi âm được tạo (0 hoặc 1)
     */
    @Transactional
    public int reversePackageSaleUnused(String sourceOrderId, String packageId,
                                        int remainingSessions, int totalSessions) {
        if (sourceOrderId == null || packageId == null || totalSessions <= 0 || remainingSessions <= 0) {
            return 0;
        }
        String saleRef = sourceOrderId + ":" + packageId;
        List<Commission> originals = commissionRepository.findByReferenceIdStartingWith(saleRef).stream()
                .filter(c -> c.getCommissionType() == CommissionType.PACKAGE)
                .filter(c -> c.getCommissionAmount() > 0)
                .filter(c -> c.getReferenceId().equals(saleRef)) // loại các referenceId phái sinh (":...REVERSAL")
                .toList();
        if (originals.isEmpty()) {
            return 0;
        }
        Commission original = originals.get(0);
        String reversalRef = saleRef + ":CONV_REVERSAL";
        if (commissionRepository.existsByReferenceIdAndCommissionType(reversalRef, CommissionType.PACKAGE)) {
            return 0;
        }
        double fraction = (double) remainingSessions / totalSessions;
        LocalDate today = LocalDate.now();
        Commission reversal = Commission.builder()
                .employee(original.getEmployee())
                .commissionType(CommissionType.PACKAGE)
                .baseAmount(-original.getBaseAmount() * fraction)
                .commissionRate(original.getCommissionRate())
                .commissionAmount(-original.getCommissionAmount() * fraction)
                .month(today.getMonthValue())
                .year(today.getYear())
                .referenceId(reversalRef)
                .description("Hồi tố hoa hồng phần chưa dùng khi quy đổi gói (" + remainingSessions
                        + "/" + totalSessions + " buổi)")
                .customerName(original.getCustomerName())
                .serviceName(original.getServiceName())
                .build();
        commissionRepository.save(reversal);
        log.info("Reversed unused package commission {} for employee {} (ref {})",
                reversal.getCommissionAmount(),
                original.getEmployee() != null ? original.getEmployee().getName() : "?", reversalRef);
        return 1;
    }

    private int reverseByPrefix(String prefix, LocalDate when) {
        int count = 0;
        for (Commission original : commissionRepository.findByReferenceIdStartingWith(prefix)) {
            // Bỏ qua chính các bản ghi đảo (âm) đã tạo trước đó
            if (original.getCommissionAmount() < 0) {
                continue;
            }
            String reversalRef = original.getReferenceId() + ":REVERSAL";
            if (commissionRepository.existsByReferenceIdAndCommissionType(reversalRef, original.getCommissionType())) {
                continue;
            }
            Commission reversal = Commission.builder()
                    .employee(original.getEmployee())
                    .commissionType(original.getCommissionType())
                    .baseAmount(-original.getBaseAmount())
                    .commissionRate(original.getCommissionRate())
                    .commissionAmount(-original.getCommissionAmount())
                    .month(when.getMonthValue())
                    .year(when.getYear())
                    .referenceId(reversalRef)
                    .description("Hồi tố hoa hồng do hoàn/hủy đơn: " + original.getDescription())
                    .customerName(original.getCustomerName())
                    .serviceName(original.getServiceName())
                    .build();
            commissionRepository.save(reversal);
            count++;
            log.info("Reversed commission {} for employee {} (ref {})",
                    reversal.getCommissionAmount(),
                    original.getEmployee() != null ? original.getEmployee().getName() : "?",
                    reversalRef);
        }
        return count;
    }

    // ===== QUERIES =====

    @Transactional(readOnly = true)
    public List<EmployeeSalaryResponse> getSalarySummary(int month, int year) {
        return employeeRepository.findAll().stream()
                .filter(e -> e.getStatusOfEmployee() == StatusOfEmployee.ACTIVE)
                .filter(e -> !e.isSystemAccount()) // ISS-020: bỏ tài khoản hệ thống khỏi bảng lương
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
        Salary salary = salaryRepository.findByEmployee_EmployeeIdAndMonthAndYear(employee.getEmployeeId(), month, year)
                .orElse(null);
        double bonus = salary == null ? 0 : salary.getBonus();
        double penalty = salary == null ? 0 : salary.getPenalty();
        double advance = salary == null ? 0 : salary.getSalaryAdvance();
        return EmployeeSalaryResponse.builder()
                .employeeId(employee.getEmployeeId())
                .employeeName(employee.getName())
                .position(employee.getPosition())
                .month(month)
                .year(year)
                .baseSalary(baseSalary)
                .totalCommission(totalCommission)
                .commissionCount(commissions.size())
                .bonus(bonus)
                .penalty(penalty)
                .salaryAdvance(advance)
                .payrollStatus(salary == null || salary.getPayrollStatus() == null ? PayrollStatus.DRAFT : salary.getPayrollStatus())
                .totalSalary(baseSalary + totalCommission + bonus - penalty - advance)
                .build();
    }

    @Transactional
    public EmployeeSalaryResponse updatePayroll(String employeeId, int month, int year, PayrollUpdateRequest request) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new AppException(ErrorCode.EMPLOYEE_NOT_FOUND));
        Salary salary = salaryRepository.findByEmployee_EmployeeIdAndMonthAndYear(employeeId, month, year)
                .orElseGet(() -> {
                    Salary created = new Salary();
                    created.setEmployee(employee);
                    created.setMonth(month);
                    created.setYear(year);
                    created.setPayrollStatus(PayrollStatus.DRAFT);
                    return created;
                });
        if (salary.getPayrollStatus() == PayrollStatus.PAID) {
            throw new AppException(ErrorCode.OPERATION_NOT_ALLOWED, "Ky luong da chi khong the sua");
        }
        salary.setBonus(request.getBonus());
        salary.setPenalty(request.getPenalty());
        salary.setSalaryAdvance(request.getSalaryAdvance());
        if (request.getStatus() != null) {
            if (salary.getPayrollStatus() == PayrollStatus.DRAFT && request.getStatus() == PayrollStatus.PAID) {
                throw new AppException(ErrorCode.VALIDATION_ERROR, "Can chot ky luong truoc khi danh dau da chi");
            }
            salary.setPayrollStatus(request.getStatus());
        }
        double totalCommission = commissionRepository.findByEmployeeAndPeriod(employeeId, month, year)
                .stream().mapToDouble(Commission::getCommissionAmount).sum();
        salary.setTotalCommission(totalCommission);
        salary.setTotalSalary(employee.getBaseSalary() + totalCommission + salary.getBonus()
                - salary.getPenalty() - salary.getSalaryAdvance());
        salaryRepository.save(salary);
        return toSalaryResponse(employee, month, year);
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
                .customerName(c.getCustomerName())
                .serviceName(c.getServiceName())
                .month(c.getMonth())
                .year(c.getYear())
                .paid(c.isPaid())
                .createdAt(c.getCreatedAt())
                .build();
    }

    /**
     * Quy ước DUY NHẤT toàn hệ thống: commissionRate lưu theo đơn vị phần trăm
     * (10 = 10%). Đổi sang phân số để nhân với tiền: 10 -> 0.10.
     * Không dùng heuristic đoán đơn vị (tránh lỗi ×100 với các mức <=1%).
     */
    private double normalizeFraction(double rate) {
        if (rate <= 0) {
            return 0;
        }
        return rate / 100.0;
    }
}
