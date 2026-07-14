package fit.quanlyspa.configuration;

import fit.quanlyspa.entity.SubscriptionPlan;
import fit.quanlyspa.repository.SubscriptionPlanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Component
@Order(20)
@RequiredArgsConstructor
public class SubscriptionPlanInitializer implements CommandLineRunner {
    private final SubscriptionPlanRepository planRepository;

    @Override
    @Transactional
    public void run(String... args) {
        upsert("STARTER", "Khởi đầu", "Dành cho spa mới bắt đầu số hóa vận hành",
                "Quản lý khách hàng|Lịch hẹn & nhắc lịch|Đơn hàng & thanh toán|Báo cáo cơ bản",
                "299000", "2990000", 5, 300, false, 1);
        upsert("PROFESSIONAL", "Chuyên nghiệp", "Đầy đủ công cụ để vận hành và tăng trưởng spa",
                "Tất cả tính năng gói Khởi đầu|Quản lý liệu trình|Lương & hoa hồng|Báo cáo nâng cao|Hỗ trợ ưu tiên",
                "599000", "5990000", 20, 1500, true, 2);
        upsert("BUSINESS", "Doanh nghiệp", "Cho chuỗi spa và đội ngũ quy mô lớn",
                "Tất cả tính năng gói Chuyên nghiệp|Không giới hạn nhân viên|Không giới hạn lịch hẹn|Phân quyền nâng cao|Hỗ trợ chuyên biệt",
                "1199000", "11990000", null, null, false, 3);
    }

    private void upsert(String code, String name, String description, String features,
                        String monthly, String yearly, Integer employees, Integer appointments,
                        boolean popular, int order) {
        SubscriptionPlan plan = planRepository.findByCode(code).orElseGet(SubscriptionPlan::new);
        plan.setCode(code);
        plan.setName(name);
        plan.setDescription(description);
        plan.setFeatures(features);
        plan.setMonthlyPrice(new BigDecimal(monthly));
        plan.setYearlyPrice(new BigDecimal(yearly));
        plan.setMaxEmployees(employees);
        plan.setMaxAppointmentsPerMonth(appointments);
        plan.setPopular(popular);
        plan.setActive(true);
        plan.setSortOrder(order);
        planRepository.save(plan);
    }
}
