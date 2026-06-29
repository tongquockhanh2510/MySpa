import type {
  Customer, Employee, Service, Appointment, TreatmentPackage,
  CustomerTreatment, Order, OrderItem, Product, Category,
  AmountPromotion, PercentPromotion, Salary, User, Role, Permission,
  DashboardStats, MonthlyRevenue, PopularService, TopEmployee, DailyAppointments,
} from '@/types';
import {
  Gender, StatusOfAppointment, StatusOfEmployee, StatusOfService,
  StatusOfPackage, OrderStatus, TypeOfOrder, ConversionType,
} from '@/types';

// ===== Customers =====
export const mockCustomers: Customer[] = [
  { customerId: 'C001', name: 'Nguyễn Thị Lan', phone: '0901234567', email: 'lan.nguyen@email.com', gender: Gender.FEMALE, note: 'Khách VIP', loyaltyPoints: 1250 },
  { customerId: 'C002', name: 'Trần Văn Nam', phone: '0912345678', email: 'nam.tran@email.com', gender: Gender.MALE, note: '', loyaltyPoints: 450 },
  { customerId: 'C003', name: 'Lê Thị Hoa', phone: '0923456789', email: 'hoa.le@email.com', gender: Gender.FEMALE, note: 'Dị ứng hương liệu', loyaltyPoints: 2100 },
  { customerId: 'C004', name: 'Phạm Minh Tuấn', phone: '0934567890', email: 'tuan.pham@email.com', gender: Gender.MALE, note: '', loyaltyPoints: 320 },
  { customerId: 'C005', name: 'Hoàng Thị Thu', phone: '0945678901', email: 'thu.hoang@email.com', gender: Gender.FEMALE, note: 'Khách thân thiết', loyaltyPoints: 3400 },
  { customerId: 'C006', name: 'Vũ Quốc Khánh', phone: '0956789012', email: 'khanh.vu@email.com', gender: Gender.MALE, note: '', loyaltyPoints: 180 },
  { customerId: 'C007', name: 'Đặng Thị Mai', phone: '0967890123', email: 'mai.dang@email.com', gender: Gender.FEMALE, note: '', loyaltyPoints: 760 },
  { customerId: 'C008', name: 'Bùi Văn Hùng', phone: '0978901234', email: 'hung.bui@email.com', gender: Gender.MALE, note: 'Khách mới', loyaltyPoints: 50 },
  { customerId: 'C009', name: 'Ngô Thị Linh', phone: '0989012345', email: 'linh.ngo@email.com', gender: Gender.FEMALE, note: '', loyaltyPoints: 920 },
  { customerId: 'C010', name: 'Đinh Văn Phong', phone: '0990123456', email: 'phong.dinh@email.com', gender: Gender.MALE, note: '', loyaltyPoints: 640 },
  { customerId: 'C011', name: 'Lý Thị Ngọc', phone: '0901112233', email: 'ngoc.ly@email.com', gender: Gender.FEMALE, note: 'Khách VIP', loyaltyPoints: 4200 },
  { customerId: 'C012', name: 'Trương Văn Đức', phone: '0912223344', email: 'duc.truong@email.com', gender: Gender.MALE, note: '', loyaltyPoints: 200 },
];

// ===== Employees =====
export const mockEmployees: Employee[] = [
  { employeeId: 'E001', name: 'Nguyễn Thị Bích', phone: '0901111111', email: 'bich.nguyen@myspa.vn', statusOfEmployee: StatusOfEmployee.ACTIVE, position: 'Kỹ thuật viên chăm sóc da', baseSalary: 8000000 },
  { employeeId: 'E002', name: 'Trần Thị Hương', phone: '0902222222', email: 'huong.tran@myspa.vn', statusOfEmployee: StatusOfEmployee.ACTIVE, position: 'Kỹ thuật viên massage', baseSalary: 7500000 },
  { employeeId: 'E003', name: 'Lê Văn Tuấn', phone: '0903333333', email: 'tuan.le@myspa.vn', statusOfEmployee: StatusOfEmployee.ACTIVE, position: 'Chuyên viên nail', baseSalary: 7000000 },
  { employeeId: 'E004', name: 'Phạm Thị Nga', phone: '0904444444', email: 'nga.pham@myspa.vn', statusOfEmployee: StatusOfEmployee.ACTIVE, position: 'Lễ tân', baseSalary: 6000000 },
  { employeeId: 'E005', name: 'Hoàng Văn Long', phone: '0905555555', email: 'long.hoang@myspa.vn', statusOfEmployee: StatusOfEmployee.INACTIVE, position: 'Kỹ thuật viên', baseSalary: 7200000 },
  { employeeId: 'E006', name: 'Vũ Thị Thu', phone: '0906666666', email: 'thu.vu@myspa.vn', statusOfEmployee: StatusOfEmployee.ACTIVE, position: 'Kỹ thuật viên massage', baseSalary: 7800000 },
];

// ===== Categories =====
export const mockCategories: Category[] = [
  { categoryId: 'CAT001', name: 'Chăm sóc da mặt', productCount: 12 },
  { categoryId: 'CAT002', name: 'Dưỡng thể', productCount: 8 },
  { categoryId: 'CAT003', name: 'Tinh dầu', productCount: 6 },
  { categoryId: 'CAT004', name: 'Dụng cụ spa', productCount: 15 },
  { categoryId: 'CAT005', name: 'Mỹ phẩm', productCount: 20 },
];

// ===== Services =====
export const mockServices: Service[] = [
  { serviceId: 'SV001', name: 'Chăm sóc da cơ bản', price: 350000, duration: 60, description: 'Làm sạch, tẩy tế bào chết và dưỡng ẩm chuyên sâu', statusOfService: StatusOfService.ACTIVE, commissionRate: 15, employeeId: 'E001', employeeName: 'Nguyễn Thị Bích' },
  { serviceId: 'SV002', name: 'Massage thư giãn toàn thân', price: 550000, duration: 90, description: 'Massage thư giãn với tinh dầu thiên nhiên', statusOfService: StatusOfService.ACTIVE, commissionRate: 18, employeeId: 'E002', employeeName: 'Trần Thị Hương' },
  { serviceId: 'SV003', name: 'Nail cơ bản', price: 200000, duration: 45, description: 'Sơn gel và chăm sóc móng tay', statusOfService: StatusOfService.ACTIVE, commissionRate: 20, employeeId: 'E003', employeeName: 'Lê Văn Tuấn' },
  { serviceId: 'SV004', name: 'Trị liệu da mụn', price: 450000, duration: 75, description: 'Điều trị mụn chuyên sâu với công nghệ hiện đại', statusOfService: StatusOfService.ACTIVE, commissionRate: 15, employeeId: 'E001', employeeName: 'Nguyễn Thị Bích' },
  { serviceId: 'SV005', name: 'Gội đầu dưỡng sinh', price: 180000, duration: 30, description: 'Gội đầu bằng thảo mộc thiên nhiên', statusOfService: StatusOfService.ACTIVE, commissionRate: 12, employeeId: 'E002', employeeName: 'Trần Thị Hương' },
  { serviceId: 'SV006', name: 'Massage mặt nâng cơ', price: 400000, duration: 60, description: 'Massage kết hợp công nghệ sóng âm nâng cơ', statusOfService: StatusOfService.ACTIVE, commissionRate: 16, employeeId: 'E006', employeeName: 'Vũ Thị Thu' },
  { serviceId: 'SV007', name: 'Tắm trắng toàn thân', price: 800000, duration: 120, description: 'Liệu trình tắm trắng với bột ngọc trai', statusOfService: StatusOfService.INACTIVE, commissionRate: 20, employeeId: 'E002', employeeName: 'Trần Thị Hương' },
];

// ===== Treatment Packages =====
export const mockTreatmentPackages: TreatmentPackage[] = [
  { treatmentPackageId: 'TP001', packageName: 'Gói chăm sóc da 10 buổi', totalSessions: 10, packagePrice: 3000000, description: 'Chăm sóc da chuyên sâu 10 buổi, tiết kiệm 15% so với lẻ', statusOfPakage: StatusOfPackage.ACTIVE, employeeId: 'E001' },
  { treatmentPackageId: 'TP002', packageName: 'Gói massage thư giãn 5 buổi', totalSessions: 5, packagePrice: 2500000, description: 'Massage thư giãn 5 buổi với tinh dầu cao cấp', statusOfPakage: StatusOfPackage.ACTIVE, employeeId: 'E002' },
  { treatmentPackageId: 'TP003', packageName: 'Gói điều trị mụn 8 buổi', totalSessions: 8, packagePrice: 3200000, description: 'Điều trị mụn chuyên sâu 8 buổi', statusOfPakage: StatusOfPackage.ACTIVE, employeeId: 'E001' },
  { treatmentPackageId: 'TP004', packageName: 'Gói VIP toàn diện 12 buổi', totalSessions: 12, packagePrice: 8000000, description: 'Gói dịch vụ toàn diện cao cấp dành cho khách VIP', statusOfPakage: StatusOfPackage.ACTIVE, employeeId: 'E006' },
  { treatmentPackageId: 'TP005', packageName: 'Gói nail gel 6 buổi', totalSessions: 6, packagePrice: 1100000, description: 'Sơn gel 6 lần với nhiều màu tùy chọn', statusOfPakage: StatusOfPackage.INACTIVE, employeeId: 'E003' },
];

// ===== Customer Treatments =====
export const mockCustomerTreatments: CustomerTreatment[] = [
  { customerId: 'C001', packageId: 'TP001', customerName: 'Nguyễn Thị Lan', packageName: 'Gói chăm sóc da 10 buổi', remainingSessions: 6, purchaseDate: '2024-01-15', expiryDate: '2024-07-15' },
  { customerId: 'C003', packageId: 'TP002', customerName: 'Lê Thị Hoa', packageName: 'Gói massage thư giãn 5 buổi', remainingSessions: 2, purchaseDate: '2024-02-10', expiryDate: '2024-05-10' },
  { customerId: 'C005', packageId: 'TP004', customerName: 'Hoàng Thị Thu', packageName: 'Gói VIP toàn diện 12 buổi', remainingSessions: 10, purchaseDate: '2024-03-01', expiryDate: '2024-09-01' },
  { customerId: 'C007', packageId: 'TP003', customerName: 'Đặng Thị Mai', packageName: 'Gói điều trị mụn 8 buổi', remainingSessions: 4, purchaseDate: '2024-01-20', expiryDate: '2024-04-20' },
];

// ===== Appointments =====
const today = new Date();
const fmt = (d: Date) => d.toISOString();
const daysFrom = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return d;
};

export const mockAppointments: Appointment[] = [
  { appointmentId: 'AP001', statusOfAppointment: StatusOfAppointment.CONFIRMED, dateTime: fmt(daysFrom(0)), note: 'Khách yêu cầu phòng yên tĩnh', customerId: 'C001', customerName: 'Nguyễn Thị Lan', customerPhone: '0901234567' },
  { appointmentId: 'AP002', statusOfAppointment: StatusOfAppointment.PENDING, dateTime: fmt(daysFrom(0)), note: '', customerId: 'C002', customerName: 'Trần Văn Nam', customerPhone: '0912345678' },
  { appointmentId: 'AP003', statusOfAppointment: StatusOfAppointment.CONFIRMED, dateTime: fmt(daysFrom(1)), note: 'Dị ứng hương liệu', customerId: 'C003', customerName: 'Lê Thị Hoa', customerPhone: '0923456789' },
  { appointmentId: 'AP004', statusOfAppointment: StatusOfAppointment.COMPLETED, dateTime: fmt(daysFrom(-1)), note: '', customerId: 'C004', customerName: 'Phạm Minh Tuấn', customerPhone: '0934567890' },
  { appointmentId: 'AP005', statusOfAppointment: StatusOfAppointment.COMPLETED, dateTime: fmt(daysFrom(-1)), note: '', customerId: 'C005', customerName: 'Hoàng Thị Thu', customerPhone: '0945678901' },
  { appointmentId: 'AP006', statusOfAppointment: StatusOfAppointment.CANCELLED, dateTime: fmt(daysFrom(-2)), note: 'Khách bận đột xuất', customerId: 'C006', customerName: 'Vũ Quốc Khánh', customerPhone: '0956789012' },
  { appointmentId: 'AP007', statusOfAppointment: StatusOfAppointment.PENDING, dateTime: fmt(daysFrom(2)), note: '', customerId: 'C007', customerName: 'Đặng Thị Mai', customerPhone: '0967890123' },
  { appointmentId: 'AP008', statusOfAppointment: StatusOfAppointment.CONFIRMED, dateTime: fmt(daysFrom(2)), note: '', customerId: 'C009', customerName: 'Ngô Thị Linh', customerPhone: '0989012345' },
  { appointmentId: 'AP009', statusOfAppointment: StatusOfAppointment.IN_PROGRESS, dateTime: fmt(daysFrom(0)), note: '', customerId: 'C011', customerName: 'Lý Thị Ngọc', customerPhone: '0901112233' },
  { appointmentId: 'AP010', statusOfAppointment: StatusOfAppointment.CONFIRMED, dateTime: fmt(daysFrom(3)), note: '', customerId: 'C012', customerName: 'Trương Văn Đức', customerPhone: '0912223344' },
];

// ===== Products =====
export const mockProducts: Product[] = [
  { productId: 'P001', name: 'Kem dưỡng ẩm L\'Oreal', price: 450000, brand: 'L\'Oreal', stockQuantity: 25, description: 'Kem dưỡng ẩm chuyên sâu cho da khô', categoryId: 'CAT001', categoryName: 'Chăm sóc da mặt' },
  { productId: 'P002', name: 'Serum vitamin C', price: 680000, brand: 'The Ordinary', stockQuantity: 8, description: 'Serum làm sáng da và chống oxy hoá', categoryId: 'CAT001', categoryName: 'Chăm sóc da mặt' },
  { productId: 'P003', name: 'Tinh dầu oải hương', price: 320000, brand: 'Aroma', stockQuantity: 3, description: 'Tinh dầu thiên nhiên cho massage', categoryId: 'CAT003', categoryName: 'Tinh dầu' },
  { productId: 'P004', name: 'Sữa tắm dưỡng thể', price: 280000, brand: 'Dove', stockQuantity: 40, description: 'Sữa tắm dưỡng ẩm với bơ shea', categoryId: 'CAT002', categoryName: 'Dưỡng thể' },
  { productId: 'P005', name: 'Mặt nạ đất sét', price: 180000, brand: 'Freeman', stockQuantity: 5, description: 'Mặt nạ se khít lỗ chân lông', categoryId: 'CAT001', categoryName: 'Chăm sóc da mặt' },
  { productId: 'P006', name: 'Đá cuội massage mặt', price: 550000, brand: 'SpaTools', stockQuantity: 12, description: 'Đá cuội tự nhiên dùng cho massage', categoryId: 'CAT004', categoryName: 'Dụng cụ spa' },
  { productId: 'P007', name: 'Kem chống nắng SPF50', price: 390000, brand: 'Anessa', stockQuantity: 2, description: 'Kem chống nắng vật lý SPF50+', categoryId: 'CAT005', categoryName: 'Mỹ phẩm' },
  { productId: 'P008', name: 'Toner cân bằng da', price: 250000, brand: 'Klairs', stockQuantity: 18, description: 'Toner dịu nhẹ, phù hợp mọi loại da', categoryId: 'CAT001', categoryName: 'Chăm sóc da mặt' },
];

// ===== Orders =====
const mockOrderItems: OrderItem[] = [
  { orderItemId: 1, quantity: 1, unitPrice: 350000, amount: 350000, serviceId: 'SV001', serviceName: 'Chăm sóc da cơ bản' },
  { orderItemId: 2, quantity: 2, unitPrice: 180000, amount: 360000, productId: 'P004', productName: 'Sữa tắm dưỡng thể' },
];

export const mockOrders: Order[] = [
  { orderId: 'OD001', totalAmount: 550000, orderStatus: OrderStatus.PAID, typeOfOrder: TypeOfOrder.SERVICE_ORDER, paidAmount: 550000, remainingAmount: 0, customerId: 'C001', customerName: 'Nguyễn Thị Lan', items: [mockOrderItems[0]], createdAt: new Date(Date.now() - 3600000).toISOString() },
  { orderId: 'OD002', totalAmount: 710000, orderStatus: OrderStatus.PARTIALLY_PAID, typeOfOrder: TypeOfOrder.PRODUCT_ORDER, paidAmount: 400000, remainingAmount: 310000, customerId: 'C003', customerName: 'Lê Thị Hoa', items: [mockOrderItems[1]], createdAt: new Date(Date.now() - 7200000).toISOString() },
  { orderId: 'OD003', totalAmount: 3000000, orderStatus: OrderStatus.PAID, typeOfOrder: TypeOfOrder.SERVICE_ORDER, paidAmount: 3000000, remainingAmount: 0, customerId: 'C005', customerName: 'Hoàng Thị Thu', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { orderId: 'OD004', totalAmount: 450000, orderStatus: OrderStatus.PENDING_PAYMENT, typeOfOrder: TypeOfOrder.SERVICE_ORDER, paidAmount: 0, remainingAmount: 450000, customerId: 'C002', customerName: 'Trần Văn Nam', createdAt: new Date(Date.now() - 172800000).toISOString() },
  { orderId: 'OD005', totalAmount: 1680000, orderStatus: OrderStatus.PAID, typeOfOrder: TypeOfOrder.PRODUCT_ORDER, paidAmount: 1680000, remainingAmount: 0, customerId: 'C007', customerName: 'Đặng Thị Mai', createdAt: new Date(Date.now() - 259200000).toISOString() },
  { orderId: 'OD006', totalAmount: 8000000, orderStatus: OrderStatus.PAID, typeOfOrder: TypeOfOrder.CONVERT_FROM_PACKAGE, paidAmount: 8000000, remainingAmount: 0, customerId: 'C011', customerName: 'Lý Thị Ngọc', createdAt: new Date(Date.now() - 345600000).toISOString() },
];

// ===== Promotions =====
export const mockAmountPromotions: AmountPromotion[] = [
  { promotionId: 'PRA001', name: 'Giảm 100k cho đơn từ 500k', code: 'GIAM100K', minOrderValue: 500000, effective: '2024-01-01T00:00:00', expiration: '2024-12-31T23:59:59', quantity: 100, isActive: true, discount: 100000, type: 'AMOUNT' },
  { promotionId: 'PRA002', name: 'Giảm 200k dịp sinh nhật', code: 'BIRTHDAY200', minOrderValue: 1000000, effective: '2024-01-01T00:00:00', expiration: '2024-12-31T23:59:59', quantity: 50, isActive: true, discount: 200000, type: 'AMOUNT' },
];

export const mockPercentPromotions: PercentPromotion[] = [
  { promotionId: 'PRP001', name: 'Giảm 10% cuối tuần', code: 'WEEKEND10', minOrderValue: 300000, effective: '2024-01-01T00:00:00', expiration: '2024-12-31T23:59:59', quantity: 200, isActive: true, percent: 10, maxDiscount: 200000, type: 'PERCENT' },
  { promotionId: 'PRP002', name: 'Giảm 15% cho khách mới', code: 'NEWCUST15', minOrderValue: 200000, effective: '2024-01-01T00:00:00', expiration: '2024-06-30T23:59:59', quantity: 30, isActive: false, percent: 15, maxDiscount: 300000, type: 'PERCENT' },
];

// ===== Salaries =====
export const mockSalaries: Salary[] = [
  { salaryId: 'SAL001', month: 5, year: 2024, totalWorkingHours: 176, bonus: 500000, penalty: 0, totalSalary: 9200000, totalCommission: 700000, employeeId: 'E001', employeeName: 'Nguyễn Thị Bích', baseSalary: 8000000 },
  { salaryId: 'SAL002', month: 5, year: 2024, totalWorkingHours: 168, bonus: 300000, penalty: 100000, totalSalary: 8200000, totalCommission: 500000, employeeId: 'E002', employeeName: 'Trần Thị Hương', baseSalary: 7500000 },
  { salaryId: 'SAL003', month: 5, year: 2024, totalWorkingHours: 160, bonus: 0, penalty: 0, totalSalary: 7800000, totalCommission: 800000, employeeId: 'E003', employeeName: 'Lê Văn Tuấn', baseSalary: 7000000 },
  { salaryId: 'SAL004', month: 5, year: 2024, totalWorkingHours: 176, bonus: 200000, penalty: 0, totalSalary: 6500000, totalCommission: 300000, employeeId: 'E004', employeeName: 'Phạm Thị Nga', baseSalary: 6000000 },
  { salaryId: 'SAL005', month: 5, year: 2024, totalWorkingHours: 176, bonus: 700000, penalty: 0, totalSalary: 9200000, totalCommission: 720000, employeeId: 'E006', employeeName: 'Vũ Thị Thu', baseSalary: 7800000 },
];

// ===== Users, Roles, Permissions =====
export const mockPermissions: Permission[] = [
  { name: 'VIEW_CUSTOMER', description: 'Xem danh sách khách hàng' },
  { name: 'CREATE_CUSTOMER', description: 'Tạo khách hàng mới' },
  { name: 'UPDATE_CUSTOMER', description: 'Cập nhật thông tin khách hàng' },
  { name: 'DELETE_CUSTOMER', description: 'Xóa khách hàng' },
  { name: 'VIEW_EMPLOYEE', description: 'Xem danh sách nhân viên' },
  { name: 'MANAGE_EMPLOYEE', description: 'Quản lý nhân viên' },
  { name: 'VIEW_APPOINTMENT', description: 'Xem lịch hẹn' },
  { name: 'MANAGE_APPOINTMENT', description: 'Quản lý lịch hẹn' },
  { name: 'VIEW_ORDER', description: 'Xem đơn hàng' },
  { name: 'MANAGE_ORDER', description: 'Quản lý đơn hàng' },
  { name: 'VIEW_REPORT', description: 'Xem báo cáo' },
  { name: 'MANAGE_USER', description: 'Quản lý người dùng' },
  { name: 'MANAGE_ROLE', description: 'Quản lý vai trò' },
];

export const mockRoles: Role[] = [
  { name: 'ADMIN', description: 'Quản trị viên hệ thống', permissions: mockPermissions },
  { name: 'MANAGER', description: 'Quản lý spa', permissions: mockPermissions.filter(p => !['MANAGE_USER', 'MANAGE_ROLE'].includes(p.name)) },
  { name: 'STAFF', description: 'Nhân viên', permissions: mockPermissions.filter(p => ['VIEW_CUSTOMER', 'VIEW_APPOINTMENT', 'MANAGE_APPOINTMENT', 'VIEW_ORDER'].includes(p.name)) },
  { name: 'RECEPTIONIST', description: 'Lễ tân', permissions: mockPermissions.filter(p => ['VIEW_CUSTOMER', 'CREATE_CUSTOMER', 'VIEW_APPOINTMENT', 'MANAGE_APPOINTMENT'].includes(p.name)) },
];

export const mockUsers: User[] = [
  { userId: 'U001', userName: 'admin', roles: [mockRoles[0]], employeeName: 'Quản trị viên' },
  { userId: 'U002', userName: 'manager01', roles: [mockRoles[1]], employeeId: 'E004', employeeName: 'Phạm Thị Nga' },
  { userId: 'U003', userName: 'bich.nguyen', roles: [mockRoles[2]], employeeId: 'E001', employeeName: 'Nguyễn Thị Bích' },
  { userId: 'U004', userName: 'huong.tran', roles: [mockRoles[2]], employeeId: 'E002', employeeName: 'Trần Thị Hương' },
  { userId: 'U005', userName: 'receptionist01', roles: [mockRoles[3]], employeeId: 'E004', employeeName: 'Phạm Thị Nga' },
];

// ===== Dashboard =====
export const mockDashboardStats: DashboardStats = {
  todayRevenue: 4750000,
  todayAppointments: 12,
  newCustomers: 3,
  activeEmployees: 5,
  soldPackages: 2,
  revenueGrowth: 12.5,
  appointmentGrowth: 8.3,
  customerGrowth: 25.0,
};

export const mockMonthlyRevenue: MonthlyRevenue[] = [
  { month: 'T1', revenue: 45000000, target: 50000000 },
  { month: 'T2', revenue: 52000000, target: 50000000 },
  { month: 'T3', revenue: 48000000, target: 55000000 },
  { month: 'T4', revenue: 61000000, target: 55000000 },
  { month: 'T5', revenue: 55000000, target: 60000000 },
  { month: 'T6', revenue: 67000000, target: 60000000 },
  { month: 'T7', revenue: 72000000, target: 65000000 },
  { month: 'T8', revenue: 68000000, target: 65000000 },
  { month: 'T9', revenue: 75000000, target: 70000000 },
  { month: 'T10', revenue: 81000000, target: 75000000 },
  { month: 'T11', revenue: 78000000, target: 80000000 },
  { month: 'T12', revenue: 95000000, target: 90000000 },
];

export const mockDailyAppointments: DailyAppointments[] = [
  { date: 'T2', count: 8 },
  { date: 'T3', count: 12 },
  { date: 'T4', count: 10 },
  { date: 'T5', count: 15 },
  { date: 'T6', count: 18 },
  { date: 'T7', count: 22 },
  { date: 'CN', count: 14 },
];

export const mockPopularServices: PopularService[] = [
  { name: 'Chăm sóc da', count: 145, revenue: 50750000 },
  { name: 'Massage', count: 120, revenue: 66000000 },
  { name: 'Nail', count: 98, revenue: 19600000 },
  { name: 'Trị mụn', count: 72, revenue: 32400000 },
  { name: 'Tắm trắng', count: 45, revenue: 36000000 },
];

export const mockTopEmployees: TopEmployee[] = [
  { name: 'Nguyễn Thị Bích', appointments: 58, revenue: 20300000, commission: 3045000 },
  { name: 'Trần Thị Hương', appointments: 52, revenue: 28600000, commission: 5148000 },
  { name: 'Vũ Thị Thu', appointments: 45, revenue: 18000000, commission: 2880000 },
  { name: 'Lê Văn Tuấn', appointments: 40, revenue: 8000000, commission: 1600000 },
];
