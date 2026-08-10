package fit.quanlyspa.configuration;

import fit.quanlyspa.entity.*;
import fit.quanlyspa.enums.*;
import fit.quanlyspa.repository.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
@Order(10)
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final EmployeeRepository employeeRepository;
    private final PermissionRepository permissionRepository;
    private final PasswordEncoder passwordEncoder;

    @PersistenceContext
    private final EntityManager entityManager;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        log.info("Cleaning up duplicate users and initializing default roles and admin user...");

        // Clean up duplicate usernames from database if they exist
        try {
            java.util.List<User> allUsers = entityManager.createQuery("SELECT u FROM User u ORDER BY u.createdAt ASC", User.class).getResultList();
            java.util.Map<String, User> originalUsers = new java.util.HashMap<>();
            for (User u : allUsers) {
                if (originalUsers.containsKey(u.getUserName())) {
                    log.info("Found duplicate user: {}. Deleting...", u.getUserName());
                    User originalUser = originalUsers.get(u.getUserName());

                    if (u.getEmployee() != null) {
                        Employee duplicateEmployee = u.getEmployee();
                        Employee originalEmployee = originalUser.getEmployee();

                        if (originalEmployee != null) {
                            reassignEmployeeRelations(duplicateEmployee, originalEmployee);
                            employeeRepository.delete(duplicateEmployee);
                        } else {
                            duplicateEmployee.setUser(originalUser);
                            employeeRepository.save(duplicateEmployee);
                            originalUser.setEmployee(duplicateEmployee);
                        }
                    }
                    u.getRoles().clear();
                    userRepository.save(u);
                    userRepository.delete(u);
                } else {
                    originalUsers.put(u.getUserName(), u);
                }
            }
            entityManager.flush();
            log.info("Duplicate user cleanup completed successfully");
        } catch (Exception e) {
            log.warn("Could not execute duplicate user cleanup: {}", e.getMessage(), e);
        }

        // 1. Create default roles — phai khop voi cac role dung trong @PreAuthorize va frontend
        Role adminRole = getOrCreateRole("ADMIN", "Chủ spa / Quản trị hệ thống");
        Role managerRole = getOrCreateRole("MANAGER", "Quản lý spa");
        Role receptionistRole = getOrCreateRole("RECEPTIONIST", "Lễ tân");
        Role therapistRole = getOrCreateRole("THERAPIST", "Kỹ thuật viên");
        Role staffRole = getOrCreateRole("STAFF", "Nhân viên (cũ - đã thay bằng THERAPIST)");
        getOrCreateRole("USER", "Regular Customer / User");

        // ISS-007: seed ma trận phân quyền để mỗi vai trò có "số quyền" đúng nghiệp vụ.
        // Enforcement thực tế vẫn qua @PreAuthorize hasRole ở backend; permission dùng để hiển thị/tài liệu.
        seedRolePermissions(adminRole, managerRole, receptionistRole, therapistRole, staffRole);

        // Migrate: user cu chi co role STAFF khong khop phan quyen nao → gan them THERAPIST
        for (User existing : userRepository.findAll()) {
            boolean hasStaff = existing.getRoles().stream().anyMatch(r -> "STAFF".equals(r.getName()));
            boolean hasUsableRole = existing.getRoles().stream()
                    .anyMatch(r -> Set.of("ADMIN", "MANAGER", "RECEPTIONIST", "THERAPIST").contains(r.getName()));
            if (hasStaff && !hasUsableRole) {
                existing.getRoles().add(therapistRole);
                userRepository.save(existing);
                log.info("Migrated user {} from STAFF to THERAPIST role", existing.getUserName());
            }
        }

        // 2. Create default users and employees
        User adminUser = null;
        if (!userRepository.existsByUserName("admin")) {
            adminUser = User.builder()
                    .userName("admin")
                    .password(passwordEncoder.encode("admin123"))
                    .isActive(true)
                    .roles(Set.of(adminRole))
                    .build();
            adminUser = userRepository.save(adminUser);
            log.info("Created default admin user: admin / admin123");

            if (!employeeRepository.existsByEmail("admin@myspa.com")) {
                Employee adminEmployee = Employee.builder()
                        .name("Phạm Phương Thảo")
                        .email("admin@myspa.com")
                        .phone("0123456789")
                        .gender(Gender.MALE)
                        .dateOfBirth(LocalDate.of(1990, 1, 1))
                        .position("Administrator")
                        .statusOfEmployee(StatusOfEmployee.ACTIVE)
                        .systemAccount(true)
                        .user(adminUser)
                        .hireDate(LocalDate.now())
                        .build();
                employeeRepository.save(adminEmployee);
                log.info("Created default employee for admin user");
            }
        } else {
            adminUser = userRepository.findByUserName("admin").orElse(null);
        }

        // Chỉ giữ duy nhất tài khoản admin/admin123 — không seed thêm dữ liệu demo
        // (khách hàng, phòng, dịch vụ, sản phẩm, gói liệu trình, tài khoản quanly/letan/staff_*).
    }

    // ===== ISS-007: PERMISSION MATRIX =====
    private static final java.util.Map<String, String> PERMISSION_CATALOG = new java.util.LinkedHashMap<>();
    static {
        PERMISSION_CATALOG.put("APPOINTMENT_MANAGE", "Quản lý lịch hẹn");
        PERMISSION_CATALOG.put("CUSTOMER_MANAGE", "Quản lý khách hàng");
        PERMISSION_CATALOG.put("POS_SELL", "Bán hàng / thu ngân (POS)");
        PERMISSION_CATALOG.put("SERVICE_VIEW", "Xem dịch vụ");
        PERMISSION_CATALOG.put("SERVICE_MANAGE", "Quản lý dịch vụ");
        PERMISSION_CATALOG.put("PRODUCT_MANAGE", "Quản lý sản phẩm & kho");
        PERMISSION_CATALOG.put("PACKAGE_MANAGE", "Quản lý gói liệu trình");
        PERMISSION_CATALOG.put("PROMOTION_MANAGE", "Quản lý khuyến mãi");
        PERMISSION_CATALOG.put("TREATMENT_SESSION_UPDATE", "Cập nhật buổi trị liệu");
        PERMISSION_CATALOG.put("OWN_SCHEDULE_VIEW", "Xem lịch làm việc của mình");
        PERMISSION_CATALOG.put("OWN_COMMISSION_VIEW", "Xem hoa hồng của mình");
        PERMISSION_CATALOG.put("SALARY_MANAGE", "Quản lý lương & hoa hồng");
        PERMISSION_CATALOG.put("REPORT_VIEW", "Xem báo cáo & thống kê");
        PERMISSION_CATALOG.put("EMPLOYEE_MANAGE", "Quản lý nhân viên");
        PERMISSION_CATALOG.put("SYSTEM_ADMIN", "Quản trị hệ thống (người dùng, vai trò, cấu hình)");
    }

    private void seedRolePermissions(Role admin, Role manager, Role receptionist, Role therapist, Role staff) {
        try {
            // Tạo/đảm bảo catalog quyền
            java.util.Map<String, Permission> byName = new java.util.HashMap<>();
            PERMISSION_CATALOG.forEach((name, desc) -> byName.put(name, getOrCreatePermission(name, desc)));

            java.util.Set<String> receptionistPerms = Set.of(
                    "APPOINTMENT_MANAGE", "CUSTOMER_MANAGE", "POS_SELL", "SERVICE_VIEW", "PROMOTION_MANAGE");
            java.util.Set<String> therapistPerms = Set.of(
                    "OWN_SCHEDULE_VIEW", "TREATMENT_SESSION_UPDATE", "OWN_COMMISSION_VIEW", "SERVICE_VIEW");
            // MANAGER: tất cả trừ quản trị hệ thống
            java.util.Set<String> managerPerms = new java.util.HashSet<>(PERMISSION_CATALOG.keySet());
            managerPerms.remove("SYSTEM_ADMIN");
            // ADMIN: toàn quyền
            java.util.Set<String> adminPerms = PERMISSION_CATALOG.keySet();

            assignPermissions(admin, adminPerms, byName);
            assignPermissions(manager, managerPerms, byName);
            assignPermissions(receptionist, receptionistPerms, byName);
            assignPermissions(therapist, therapistPerms, byName);
            assignPermissions(staff, therapistPerms, byName); // STAFF (legacy) = THERAPIST
            log.info("Seeded role permission matrix (ISS-007)");
        } catch (Exception e) {
            log.warn("Could not seed role permissions: {}", e.getMessage(), e);
        }
    }

    private void assignPermissions(Role role, java.util.Set<String> permNames, java.util.Map<String, Permission> byName) {
        Set<Permission> perms = permNames.stream().map(byName::get)
                .filter(java.util.Objects::nonNull)
                .collect(java.util.stream.Collectors.toSet());
        role.setPermissions(perms);
        roleRepository.save(role);
    }

    private Permission getOrCreatePermission(String name, String description) {
        return permissionRepository.findById(name).orElseGet(() -> {
            Permission p = new Permission();
            p.setName(name);
            p.setDescription(description);
            return permissionRepository.save(p);
        });
    }

    private Role getOrCreateRole(String name, String description) {
        Role role = roleRepository.findByName(name);
        if (role == null) {
            role = new Role();
            role.setName(name);
            role.setDescription(description);
            role = roleRepository.save(role);
            log.info("Created role: {}", name);
        }
        return role;
    }

    private void reassignEmployeeRelations(Employee oldEmp, Employee newEmp) {
        String[] employeeEntities = {
            "TreatmentPackage", "TreatmentRecord", "Schedule", "Salary", "Review", 
            "Notification", "Commission", "Attendance", "AppoinmentDetail"
        };
        for (String entity : employeeEntities) {
            try {
                int count = entityManager.createQuery(
                    "UPDATE " + entity + " e SET e.employee = :newEmp WHERE e.employee = :oldEmp")
                    .setParameter("newEmp", newEmp)
                    .setParameter("oldEmp", oldEmp)
                    .executeUpdate();
                if (count > 0) {
                    log.info("Reassigned {} {} records from employee {} to {}", count, entity, oldEmp.getEmployeeId(), newEmp.getEmployeeId());
                }
            } catch (Exception e) {
                log.warn("Failed to reassign {} records: {}", entity, e.getMessage());
            }
        }
        
        String[] therapistEntities = {
            "TreatmentSchedule", "TreatmentSession"
        };
        for (String entity : therapistEntities) {
            try {
                int count = entityManager.createQuery(
                    "UPDATE " + entity + " e SET e.therapist = :newEmp WHERE e.therapist = :oldEmp")
                    .setParameter("newEmp", newEmp)
                    .setParameter("oldEmp", oldEmp)
                    .executeUpdate();
                if (count > 0) {
                    log.info("Reassigned {} {} records from therapist {} to {}", count, entity, oldEmp.getEmployeeId(), newEmp.getEmployeeId());
                }
            } catch (Exception e) {
                log.warn("Failed to reassign {} records: {}", entity, e.getMessage());
            }
        }
    }
}
