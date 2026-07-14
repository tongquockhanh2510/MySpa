package fit.quanlyspa.configuration;

import fit.quanlyspa.entity.*;
import fit.quanlyspa.enums.*;
import fit.quanlyspa.repository.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final EmployeeRepository employeeRepository;
    private final CategoryRepository categoryRepository;
    private final RoomRepository roomRepository;
    private final ServiceRepository serviceRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final TreatmentPackageRepository treatmentPackageRepository;
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
                        .user(adminUser)
                        .hireDate(LocalDate.now())
                        .build();
                employeeRepository.save(adminEmployee);
                log.info("Created default employee for admin user");
            }
        } else {
            adminUser = userRepository.findByUserName("admin").orElse(null);
        }

        // Tai khoan quan ly spa
        if (!userRepository.existsByUserName("quanly")) {
            User managerUser = User.builder()
                    .userName("quanly")
                    .password(passwordEncoder.encode("quanly123"))
                    .isActive(true)
                    .roles(Set.of(managerRole))
                    .build();
            managerUser = userRepository.save(managerUser);

            if (!employeeRepository.existsByEmail("quanly@myspa.com")) {
                employeeRepository.save(Employee.builder()
                        .name("Trần Phương Thảo")
                        .email("quanly@myspa.com")
                        .phone("0328402460")
                        .gender(Gender.FEMALE)
                        .position("Quản lý spa")
                        .statusOfEmployee(StatusOfEmployee.ACTIVE)
                        .user(managerUser)
                        .hireDate(LocalDate.now())
                        .baseSalary(12000000.0)
                        .build());
            }
            log.info("Created manager user: quanly / quanly123");
        }

        // Tai khoan le tan
        if (!userRepository.existsByUserName("letan")) {
            User receptionistUser = User.builder()
                    .userName("letan")
                    .password(passwordEncoder.encode("letan123"))
                    .isActive(true)
                    .roles(Set.of(receptionistRole))
                    .build();
            receptionistUser = userRepository.save(receptionistUser);

            if (!employeeRepository.existsByEmail("letan@myspa.com")) {
                employeeRepository.save(Employee.builder()
                        .name("Lê Thu Trang")
                        .email("letan@myspa.com")
                        .phone("0912345603")
                        .gender(Gender.FEMALE)
                        .position("Lễ tân")
                        .statusOfEmployee(StatusOfEmployee.ACTIVE)
                        .user(receptionistUser)
                        .hireDate(LocalDate.now())
                        .baseSalary(7000000.0)
                        .build());
            }
            log.info("Created receptionist user: letan / letan123");
        }

        // Create staff users for testing
        Employee staff1 = null;
        if (!userRepository.existsByUserName("staff_lan")) {
            User staffUser1 = User.builder()
                    .userName("staff_lan")
                    .password(passwordEncoder.encode("staff123"))
                    .isActive(true)
                    .roles(Set.of(therapistRole))
                    .build();
            staffUser1 = userRepository.save(staffUser1);

            staff1 = Employee.builder()
                    .name("Nguyễn Thị Lan")
                    .email("lannguyen@myspa.com")
                    .phone("0912345601")
                    .gender(Gender.FEMALE)
                    .dateOfBirth(LocalDate.of(1996, 3, 15))
                    .position("Kỹ thuật viên")
                    .specialty("Chăm sóc da & Trị mụn")
                    .statusOfEmployee(StatusOfEmployee.ACTIVE)
                    .user(staffUser1)
                    .hireDate(LocalDate.now())
                    .baseSalary(8000000.0)
                    .commissionRate(0.10)
                    .build();
            staff1 = employeeRepository.save(staff1);
            log.info("Created staff user: staff_lan / staff123");
        }

        Employee staff2 = null;
        if (!userRepository.existsByUserName("staff_huong")) {
            User staffUser2 = User.builder()
                    .userName("staff_huong")
                    .password(passwordEncoder.encode("staff123"))
                    .isActive(true)
                    .roles(Set.of(therapistRole))
                    .build();
            staffUser2 = userRepository.save(staffUser2);

            staff2 = Employee.builder()
                    .name("Trần Thu Hương")
                    .email("huongtran@myspa.com")
                    .phone("0912345602")
                    .gender(Gender.FEMALE)
                    .dateOfBirth(LocalDate.of(1998, 8, 20))
                    .position("Kỹ thuật viên")
                    .specialty("Massage body & Đá nóng")
                    .statusOfEmployee(StatusOfEmployee.ACTIVE)
                    .user(staffUser2)
                    .hireDate(LocalDate.now())
                    .baseSalary(8000000.0)
                    .commissionRate(0.10)
                    .build();
            staff2 = employeeRepository.save(staff2);
            log.info("Created staff user: staff_huong / staff123");
        }

        // 3. Create Categories
        Category catSkincare = getOrCreateCategory("cat-skincare", "Chăm sóc da");
        Category catMassage = getOrCreateCategory("cat-massage", "Massage trị liệu");
        Category catAcne = getOrCreateCategory("cat-acne", "Điều trị mụn");
        Category catCosmetic = getOrCreateCategory("cat-cosmetic", "Mỹ phẩm dưỡng da");

        // 4. Create Rooms
        if (roomRepository.count() == 0) {
            roomRepository.save(Room.builder().roomId("room-vip1").roomName("Phòng VIP 1").roomNumber("101").capacity(2).description("Phòng massage cao cấp dành cho cặp đôi").status(RoomStatus.AVAILABLE).build());
            roomRepository.save(Room.builder().roomId("room-vip2").roomName("Phòng VIP 2").roomNumber("102").capacity(2).description("Phòng massage cao cấp đơn").status(RoomStatus.AVAILABLE).build());
            roomRepository.save(Room.builder().roomId("room-skincare1").roomName("Phòng Chăm Sóc Da 1").roomNumber("201").capacity(5).description("Phòng chăm sóc da cơ bản").status(RoomStatus.AVAILABLE).build());
            roomRepository.save(Room.builder().roomId("room-sauna").roomName("Phòng Xông Hơi").roomNumber("301").capacity(6).description("Phòng xông hơi đá muối Himalaya").status(RoomStatus.AVAILABLE).build());
            log.info("Initialized default rooms");
        }

        // 5. Create Customers
        if (customerRepository.count() == 0) {
            customerRepository.save(Customer.builder()
                    .customerId("cust-001")
                    .name("Nguyễn Thị Minh An")
                    .phone("0901234567")
                    .email("minhan@gmail.com")
                    .gender(Gender.FEMALE)
                    .dateOfBirth(LocalDate.of(1995, 4, 12))
                    .address("456 Nguyễn Thị Minh Khai, Quận 3, TP. HCM")
                    .skinType("Da dầu nhạy cảm")
                    .allergyInfo("Dị ứng cồn khô")
                    .note("Khách hàng thân thiết")
                    .loyaltyPoints(120.0)
                    .isActive(true)
                    .build());
            customerRepository.save(Customer.builder()
                    .customerId("cust-002")
                    .name("Lê Hoài Nam")
                    .phone("0902345678")
                    .email("namle@gmail.com")
                    .gender(Gender.MALE)
                    .dateOfBirth(LocalDate.of(1988, 10, 25))
                    .address("789 Cách Mạng Tháng Tám, Quận 10, TP. HCM")
                    .skinType("Da thường")
                    .note("Khách thích massage lực mạnh")
                    .loyaltyPoints(50.0)
                    .isActive(true)
                    .build());
            log.info("Initialized default customers");
        }

        // 6. Create Services
        if (serviceRepository.count() == 0) {
            serviceRepository.save(Service.builder()
                    .serviceId("srv-skincare-basic")
                    .name("Chăm sóc da mặt cơ bản")
                    .price(250000.0)
                    .duration(60.0)
                    .description("Liệu trình rửa mặt, tẩy da chết, xông hơi hút mụn cám, đắp mặt nạ và massage mặt thư giãn.")
                    .statusOfService(StatusOfService.ACTIVE)
                    .commissionRate(0.05)
                    .category(catSkincare)
                    .build());
            serviceRepository.save(Service.builder()
                    .serviceId("srv-massage-hotstone")
                    .name("Massage body đá nóng Thụy Điển")
                    .price(500000.0)
                    .duration(90.0)
                    .description("Kết hợp tinh dầu thiên nhiên và đá nóng bazan giúp giải tỏa căng thẳng cơ bắp.")
                    .statusOfService(StatusOfService.ACTIVE)
                    .commissionRate(0.10)
                    .category(catMassage)
                    .build());
            serviceRepository.save(Service.builder()
                    .serviceId("srv-acne-treatment")
                    .name("Điều trị mụn y khoa chuyên sâu")
                    .price(400000.0)
                    .duration(80.0)
                    .description("Liệu trình lấy nhân mụn chuẩn y khoa kết hợp sát khuẩn điện tím.")
                    .statusOfService(StatusOfService.ACTIVE)
                    .commissionRate(0.08)
                    .category(catAcne)
                    .build());
            log.info("Initialized default services");
        }

        // 7. Create Products
        if (productRepository.count() == 0) {
            productRepository.save(Product.builder()
                    .productId("prod-cleanser")
                    .name("Sữa Rửa Mặt Dịu Nhẹ Cetaphil 500ml")
                    .sku("SKU-CET-500")
                    .price(320000.0)
                    .costPrice(220000.0)
                    .brand("Cetaphil")
                    .stockQuantity(50.0)
                    .minStockLevel(5.0)
                    .unit("Chai")
                    .barcode("893001001001")
                    .description("Làm sạch dịu nhẹ không gây khô da.")
                    .isActive(true)
                    .category(catCosmetic)
                    .build());
            productRepository.save(Product.builder()
                    .productId("prod-toner")
                    .name("Toner Cấp Ẩm Klairs Supple Preparation 180ml")
                    .sku("SKU-KLA-180")
                    .price(270000.0)
                    .costPrice(180000.0)
                    .brand("Dear Klairs")
                    .stockQuantity(35.0)
                    .minStockLevel(5.0)
                    .unit("Chai")
                    .barcode("893001001002")
                    .description("Cân bằng độ pH, cấp ẩm sâu.")
                    .isActive(true)
                    .category(catCosmetic)
                    .build());
            log.info("Initialized default products");
        }

        // 8. Create Treatment Packages
        if (treatmentPackageRepository.count() == 0) {
            TreatmentPackage pkg1 = new TreatmentPackage();
            pkg1.setTreatmentPackageId("pkg-acne-10");
            pkg1.setPackageName("Liệu trình trị mụn tận gốc 10 buổi");
            pkg1.setTotalSessions(10);
            pkg1.setPackagePrice(3500000.0);
            pkg1.setDescription("Liệu trình 10 buổi cam kết sạch mụn ẩn, mụn đầu đen.");
            pkg1.setStatusOfPakage(StatusOfPakage.IN_PROGRESS);
            pkg1.setEmployee(staff1);
            treatmentPackageRepository.save(pkg1);

            TreatmentPackage pkg2 = new TreatmentPackage();
            pkg2.setTreatmentPackageId("pkg-whitening-5");
            pkg2.setPackageName("Gói tắm dưỡng sáng da thảo mộc 5 buổi");
            pkg2.setTotalSessions(5);
            pkg2.setPackagePrice(2000000.0);
            pkg2.setDescription("Gói 5 buổi sử dụng thảo dược giúp nâng tông da.");
            pkg2.setStatusOfPakage(StatusOfPakage.IN_PROGRESS);
            pkg2.setEmployee(staff2);
            treatmentPackageRepository.save(pkg2);

            log.info("Initialized default treatment packages");
        }
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

    private Category getOrCreateCategory(String categoryId, String name) {
        return categoryRepository.findById(categoryId).orElseGet(() -> {
            Category cat = new Category();
            cat.setCategoryId(categoryId);
            cat.setName(name);
            cat = categoryRepository.save(cat);
            log.info("Created category: {}", name);
            return cat;
        });
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
