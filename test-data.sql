-- --- TEST DATA FOR MYSPA DATABASE ---
-- Database: Spa_Phuong_Thao_db (MariaDB/MySQL)

-- 1. Insert Roles
INSERT IGNORE INTO roles (name, description) VALUES
('ADMIN', 'System Administrator - Full Access'),
('MANAGER', 'Spa Manager - Management Access'),
('STAFF', 'Spa Staff - Operation Access'),
('USER', 'Regular Customer / User');

-- 2. Insert Default Categories
INSERT IGNORE INTO categories (category_id, name) VALUES
('cat-skincare', 'Chăm sóc da'),
('cat-massage', 'Massage trị liệu'),
('cat-acne', 'Điều trị mụn'),
('cat-cosmetic', 'Mỹ phẩm dưỡng da'),
('cat-hair', 'Chăm sóc tóc & Da đầu');

-- 3. Insert Default Rooms
INSERT IGNORE INTO rooms (room_id, room_name, room_number, capacity, description, status) VALUES
('room-vip1', 'Phòng VIP 1', '101', 2, 'Phòng massage cao cấp dành cho cặp đôi', 'AVAILABLE'),
('room-vip2', 'Phòng VIP 2', '102', 2, 'Phòng massage cao cấp đơn', 'AVAILABLE'),
('room-skincare1', 'Phòng Chăm Sóc Da 1', '201', 5, 'Phòng chăm sóc da cơ bản và chuyên sâu', 'AVAILABLE'),
('room-skincare2', 'Phòng Chăm Sóc Da 2', '202', 4, 'Phòng điều trị công nghệ cao', 'AVAILABLE'),
('room-sauna', 'Phòng Xông Hơi', '301', 6, 'Phòng xông hơi đá muối Himalaya', 'AVAILABLE');

-- 4. Insert Default Customers
INSERT IGNORE INTO customers (customer_id, name, phone, email, gender, date_of_birth, address, skin_type, allergy_info, note, loyalty_points, is_active, created_at, updated_at) VALUES
('cust-001', 'Nguyễn Thị Minh An', '0901234567', 'minhan@gmail.com', 'FEMALE', '1995-04-12', '456 Nguyễn Thị Minh Khai, Quận 3, TP. HCM', 'Da dầu nhạy cảm', 'Dị ứng cồn khô', 'Khách hàng thân thiết, ưa dùng liệu trình thiên nhiên', 120.0, 1, NOW(), NOW()),
('cust-002', 'Lê Hoài Nam', '0902345678', 'namle@gmail.com', 'MALE', '1988-10-25', '789 Cách Mạng Tháng Tám, Quận 10, TP. HCM', 'Da thường', 'Không', 'Khách thích massage lực mạnh', 50.0, 1, NOW(), NOW()),
('cust-003', 'Phạm Thanh Thảo', '0903456789', 'thao.pham@gmail.com', 'FEMALE', '1992-07-08', '121 Điện Biên Phủ, Quận Bình Thạnh, TP. HCM', 'Da khô', 'Không dị ứng', 'Làn da thiếu ẩm, cần liệu trình cấp nước', 0.0, 1, NOW(), NOW()),
('cust-004', 'Vũ Hoàng Bách', '0904567890', 'bachvu@gmail.com', 'MALE', '2000-01-15', '321 Hoàng Văn Thụ, Quận Tân Bình, TP. HCM', 'Da hỗn hợp thiên dầu', 'Không', 'Khách điều trị mụn định kỳ', 15.0, 1, NOW(), NOW());

-- 5. Insert Default Admin User (Password is 'admin123')
INSERT IGNORE INTO user (user_id, user_name, password, is_active, created_at, updated_at) VALUES
('user-admin-id', 'admin', '$2a$10$83M6dC37w.vIecmKPy5MHeEwRhy1F.M.Pebk9ZzK4/gY0uD4uRkyS', 1, NOW(), NOW());

-- 6. Map User to Admin Role
INSERT IGNORE INTO user_roles (user_id, role_name) VALUES
('user-admin-id', 'ADMIN');

-- 7. Insert Staff Users (Passwords are 'staff123' / BCrypt: $2a$10$iZg6rV8Qn8P1l.HqJ8D2v.w0tqG7l5q8qfLzJc5xO5Z5w0y8i4o9K)
INSERT IGNORE INTO user (user_id, user_name, password, is_active, created_at, updated_at) VALUES
('user-staff1-id', 'staff_lan', '$2a$10$iZg6rV8Qn8P1l.HqJ8D2v.w0tqG7l5q8qfLzJc5xO5Z5w0y8i4o9K', 1, NOW(), NOW()),
('user-staff2-id', 'staff_huong', '$2a$10$iZg6rV8Qn8P1l.HqJ8D2v.w0tqG7l5q8qfLzJc5xO5Z5w0y8i4o9K', 1, NOW(), NOW());

INSERT IGNORE INTO user_roles (user_id, role_name) VALUES
('user-staff1-id', 'STAFF'),
('user-staff2-id', 'STAFF');

-- 8. Insert Employees
INSERT IGNORE INTO employees (employee_id, name, phone, email, gender, date_of_birth, address, status_of_employee, position, specialty, avatar_url, base_salary, commission_rate, hire_date, user_id, created_at, updated_at) VALUES
('emp-admin', 'Phạm Phương Thảo', '0123456789', 'admin@myspa.com', 'FEMALE', '1990-01-01', '123 Đường Spa, TP. HCM', 'ACTIVE', 'Administrator', 'Quản lý chung', NULL, 20000000.0, 0.05, '2026-01-01', 'user-admin-id', NOW(), NOW()),
('emp-staff1', 'Nguyễn Thị Lan', '0912345601', 'lannguyen@myspa.com', 'FEMALE', '1996-03-15', '45 Bis Nguyễn Thị Minh Khai, Q.1, TP. HCM', 'ACTIVE', 'Kỹ thuật viên', 'Chăm sóc da & Trị mụn', NULL, 8000000.0, 0.10, '2026-02-01', 'user-staff1-id', NOW(), NOW()),
('emp-staff2', 'Trần Thu Hương', '0912345602', 'huongtran@myspa.com', 'FEMALE', '1998-08-20', '88 Lê Lợi, Quận 1, TP. HCM', 'ACTIVE', 'Kỹ thuật viên', 'Massage body & Đá nóng', NULL, 8000000.0, 0.10, '2026-02-15', 'user-staff2-id', NOW(), NOW());

-- 9. Insert Services
INSERT IGNORE INTO services (service_id, name, price, duration, description, image_url, status_of_service, commission_rate, min_booking_notice, max_daily_bookings, category_id, created_at, updated_at) VALUES
('srv-skincare-basic', 'Chăm sóc da mặt cơ bản', 250000.0, 60.0, 'Liệu trình rửa mặt, tẩy da chết, xông hơi hút mụn cám, đắp mặt nạ và massage mặt thư giãn.', NULL, 'ACTIVE', 0.05, 30, 20, 'cat-skincare', NOW(), NOW()),
('srv-skincare-whitening', 'Cấy tảo xoắn trẻ hóa da', 450000.0, 75.0, 'Cung cấp vitamin, vi khoáng chất nuôi dưỡng làn da căng bóng, hỗ trợ làm mờ thâm sạm.', NULL, 'ACTIVE', 0.08, 30, 15, 'cat-skincare', NOW(), NOW()),
('srv-massage-hotstone', 'Massage body đá nóng Thụy Điển', 500000.0, 90.0, 'Kết hợp tinh dầu thiên nhiên và đá nóng bazan giúp giải tỏa căng thẳng cơ bắp, lưu thông khí huyết.', NULL, 'ACTIVE', 0.10, 45, 10, 'cat-massage', NOW(), NOW()),
('srv-massage-thai', 'Massage trị liệu cổ vai gáy', 300000.0, 60.0, 'Tập trung ấn huyệt giải tỏa đau nhức mỏi cơ vùng cổ, vai và thắt lưng do ngồi văn phòng nhiều.', NULL, 'ACTIVE', 0.06, 30, 15, 'cat-massage', NOW(), NOW()),
('srv-acne-treatment', 'Điều trị mụn y khoa chuyên sâu', 400000.0, 80.0, 'Liệu trình lấy nhân mụn chuẩn y khoa kết hợp sát khuẩn điện tím và đắp mặt nạ đặc trị dịu da.', NULL, 'ACTIVE', 0.08, 30, 12, 'cat-acne', NOW(), NOW());

-- 10. Insert Products
INSERT IGNORE INTO products (product_id, name, sku, price, cost_price, brand, stock_quantity, min_stock_level, unit, barcode, description, image, is_active, category_id, created_at, updated_at) VALUES
('prod-cleanser', 'Sữa Rửa Mặt Dịu Nhẹ Cetaphil 500ml', 'SKU-CET-500', 320000.0, 220000.0, 'Cetaphil', 50.0, 5.0, 'Chai', '893001001001', 'Làm sạch dịu nhẹ không gây khô da, phù hợp với mọi loại da kể cả da nhạy cảm.', NULL, 1, 'cat-cosmetic', NOW(), NOW()),
('prod-toner', 'Toner Cấp Ẩm Klairs Supple Preparation 180ml', 'SKU-KLA-180', 270000.0, 180000.0, 'Dear Klairs', 35.0, 5.0, 'Chai', '893001001002', 'Cân bằng độ pH, cấp ẩm sâu tức thì cho làn da căng mịn.', NULL, 1, 'cat-cosmetic', NOW(), NOW()),
('prod-serum-b5', 'Tinh Chất Phục Hồi La Roche-Posay Hyalu B5 30ml', 'SKU-LRP-B5', 850000.0, 600000.0, 'La Roche-Posay', 20.0, 3.0, 'Chai', '893001001003', 'Serum chứa Hyaluronic Acid và Vitamin B5 giúp phục hồi và làm săn chắc da.', NULL, 1, 'cat-cosmetic', NOW(), NOW());

-- 11. Insert Treatment Packages
INSERT IGNORE INTO treatment_packages (treatment_package_id, package_name, total_sessions, package_price, description, status_of_package, employee_id) VALUES
('pkg-acne-10', 'Liệu trình trị mụn tận gốc 10 buổi', 10, 3500000.0, 'Liệu trình 10 buổi cam kết sạch mụn ẩn, mụn đầu đen và phục hồi da thâm.', 'IN_PROGRESS', 'emp-staff1'),
('pkg-whitening-5', 'Gói tắm dưỡng sáng da thảo mộc 5 buổi', 5, 2000000.0, 'Gói 5 buổi sử dụng thảo dược và cám gạo giúp nâng tông da tự nhiên, an toàn.', 'IN_PROGRESS', 'emp-staff2');
