// ============================================================
// TypeScript Types & Interfaces – MY SPA Management System
// ============================================================

// ===== Enums =====

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export enum StatusOfAppointment {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CHECKED_IN = 'CHECKED_IN',
  WAITING = 'WAITING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
  RESCHEDULED = 'RESCHEDULED',
}

export enum StatusOfEmployee {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum StatusOfService {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum StatusOfPackage {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum OrderStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  UNPAID = 'UNPAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export enum TypeOfOrder {
  PRODUCT_ORDER = 'PRODUCT_ORDER',
  SERVICE_ORDER = 'SERVICE_ORDER',
  CONVERT_FROM_PACKAGE = 'CONVERT_FROM_PACKAGE',
}

export enum ConversionType {
  TO_SERVICE = 'TO_SERVICE',
  TO_PRODUCT = 'TO_PRODUCT',
  TO_DISCOUNT = 'TO_DISCOUNT',
  TO_PACKAGE = 'TO_PACKAGE',
}

// ===== API Response Wrapper =====

export interface ApiResponse<T> {
  code: number;
  message?: string;
  result: T;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface PageRequest {
  page?: number;
  size?: number;
  sort?: string;
  search?: string;
}

// ===== Auth =====

export interface LoginRequest {
  userName: string;
  password: string;
}

export interface AuthResponse {
  // Fields từ mock
  token?: string;
  authenticated?: boolean;
  // Fields từ backend AuthenticationResponse
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: number;
  userId?: string;
  username?: string;
  roles?: Set<string> | string[];
  employeeId?: string;
  employeeName?: string;
  avatarUrl?: string;
}

export interface UserInfo {
  userId: string;
  userName: string;
  roles: Role[];
  employee?: Employee;
  employeeId?: string;
  employeeName?: string;
  avatarUrl?: string;
}

// ===== Customer =====

export interface Customer {
  customerId: string;
  name: string;
  phone: string;
  email: string;
  gender: Gender;
  note?: string;
  loyaltyPoints: number;
}

export interface CustomerFormData {
  customerId?: string;
  name: string;
  phone: string;
  email: string;
  gender: Gender;
  note?: string;
}

// ===== Employee =====

export interface Employee {
  employeeId: string;
  name: string;
  phone: string;
  email: string;
  statusOfEmployee: StatusOfEmployee;
  position: string;
  baseSalary: number;
  userId?: string;
  accountUserName?: string | null;
  accountActive?: boolean | null;
  accountRoles?: string[];
}

export interface EmployeeAccount {
  accountUserName?: string | null;
  accountActive?: boolean | null;
  accountRoles?: string[];
}

export interface EmployeeFormData {
  employeeId?: string;
  name: string;
  phone: string;
  email: string;
  statusOfEmployee: StatusOfEmployee;
  position: string;
  baseSalary: number;
}

// ===== Service =====

export interface Service {
  serviceId: string;
  name: string;
  price: number;
  costPrice?: number;
  duration: number;
  description: string;
  statusOfService: StatusOfService;
  commissionRate: number;
  image?: string;
  employeeId?: string;
  employeeName?: string;
}

export interface ServiceFormData {
  serviceId?: string;
  name: string;
  price: number;
  costPrice?: number;
  duration: number;
  description: string;
  statusOfService: StatusOfService;
  commissionRate: number;
  image?: string;
  employeeId?: string;
}

// ===== Appointment =====

export interface Appointment {
  appointmentId: string;
  statusOfAppointment: StatusOfAppointment;
  dateTime: string;
  note?: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  roomId?: string;
  roomName?: string;
  details?: AppointmentDetail[];
}

export interface AppointmentDetail {
  appointmentId: string;
  serviceId: string;
  employeeId: string;
  serviceName: string;
  employeeName: string;
  price: number;
}

export interface AppointmentFormData {
  customerId: string;
  dateTime: string;
  note?: string;
  details: {
    serviceId: string;
    employeeId: string;
    price: number;
  }[];
}

// ===== Treatment Package =====

export interface TreatmentPackage {
  treatmentPackageId: string;
  packageName: string;
  totalSessions: number;
  packagePrice: number;
  description: string;
  statusOfPakage: StatusOfPackage;
  employeeId?: string;
  employeeName?: string;
}

export interface TreatmentPackageFormData {
  treatmentPackageId?: string;
  packageName: string;
  totalSessions: number;
  packagePrice: number;
  description: string;
  statusOfPakage: StatusOfPackage;
  employeeId?: string;
}

// ===== Customer Treatment =====

export interface CustomerTreatment {
  customerId: string;
  packageId: string;
  customerName: string;
  customerPhone?: string;
  packageName: string;
  totalSessions?: number;
  packagePrice?: number;
  remainingSessions: number;
  purchaseDate: string;
  expiryDate: string;
  cancelDate?: string;
  cancelReason?: string;
  packageConversionId?: string;
}

// ===== Package Conversion =====

export interface PackageConversion {
  conversionId: string;
  conversionType: ConversionType;
  conversionValue: number;
  conversionDate: string;
  note?: string;
  customerId?: string;
  packageId?: string;
  targetProductId?: string;
  targetProductName?: string;
  targetPackageId?: string;
  targetPackageName?: string;
  voucherCode?: string;
  convertedSessions?: number;
}

// ===== Order =====

export interface Order {
  orderId: string;
  totalAmount: number;
  orderStatus: OrderStatus;
  typeOfOrder: TypeOfOrder;
  paidAmount: number;
  remainingAmount: number;
  customerId: string;
  customerName: string;
  items?: OrderItem[];
  createdAt?: string;
}

export interface OrderItem {
  orderItemId: number;
  quantity: number;
  unitPrice: number;
  amount: number;
  productId?: string;
  productName?: string;
  serviceId?: string;
  serviceName?: string;
  packageId?: string;
  packageName?: string;
  promotions?: Promotion[];
}

export interface OrderFormData {
  customerId: string;
  typeOfOrder: TypeOfOrder;
  items: {
    productId?: string;
    serviceId?: string;
    packageId?: string;
    quantity: number;
    unitPrice: number;
  }[];
  paidAmount: number;
}

// ===== Product =====

export interface Product {
  productId: string;
  name: string;
  sku?: string;
  price: number;
  costPrice?: number;
  brand: string;
  stockQuantity: number;
  minStockLevel?: number;
  unit?: string;
  barcode?: string;
  description: string;
  image?: string;
  active?: boolean;
  categoryId?: string;
  categoryName?: string;
  employeeId?: string;
}

export interface ProductFormData {
  productId?: string;
  name: string;
  sku?: string;
  price: number;
  costPrice?: number;
  brand: string;
  stockQuantity: number;
  minStockLevel?: number;
  unit?: string;
  barcode?: string;
  description: string;
  image?: string;
  categoryId?: string;
  employeeId?: string;
}

// ===== Category =====

export interface Category {
  categoryId: string;
  name: string;
  productCount?: number;
}

export interface CategoryFormData {
  categoryId?: string;
  name: string;
}

// ===== Promotion =====

export interface Promotion {
  promotionId: string;
  name: string;
  code: string;
  minOrderValue: number;
  effective: string;
  expiration: string;
  quantity: number;
  isActive: boolean;
  createAt?: string;
  type: 'AMOUNT' | 'PERCENT';
  applyScope?: 'ORDER' | 'ITEM';
  targetType?: 'PRODUCT' | 'SERVICE' | 'PACKAGE' | '';
  targetId?: string;
}

export interface AmountPromotion extends Promotion {
  type: 'AMOUNT';
  discount: number;
}

export interface PercentPromotion extends Promotion {
  type: 'PERCENT';
  percent: number;
  maxDiscount: number;
}

export interface AmountPromotionFormData {
  name: string;
  code: string;
  minOrderValue: number;
  effective: string;
  expiration: string;
  quantity: number;
  isActive: boolean;
  discount: number;
  applyScope?: 'ORDER' | 'ITEM';
  targetType?: 'PRODUCT' | 'SERVICE' | 'PACKAGE' | '';
  targetId?: string;
}

export interface PercentPromotionFormData {
  name: string;
  code: string;
  minOrderValue: number;
  effective: string;
  expiration: string;
  quantity: number;
  isActive: boolean;
  percent: number;
  maxDiscount: number;
  applyScope?: 'ORDER' | 'ITEM';
  targetType?: 'PRODUCT' | 'SERVICE' | 'PACKAGE' | '';
  targetId?: string;
}

// ===== Salary =====

export interface Salary {
  salaryId: string;
  month: number;
  year: number;
  totalWorkingHours: number;
  bonus: number;
  penalty: number;
  totalSalary: number;
  totalCommission: number;
  employeeId: string;
  employeeName: string;
  baseSalary?: number;
}

export interface SalaryFormData {
  month: number;
  year: number;
  totalWorkingHours: number;
  bonus: number;
  penalty: number;
  totalCommission: number;
  employeeId: string;
}

// ===== User / Role / Permission =====

export interface Permission {
  name: string;
  description: string;
}

export interface Role {
  name: string;
  description: string;
  permissions: Permission[];
}

export interface User {
  userId: string;
  userName: string;
  isActive?: boolean;
  roles: Role[];
  employeeId?: string;
  employeeName?: string;
}

export interface UserFormData {
  userId?: string;
  userName: string;
  password?: string;
  roleNames: string[];
}

export interface RoleFormData {
  name: string;
  description: string;
  permissionNames: string[];
}

export interface PermissionFormData {
  name: string;
  description: string;
}

// ===== Dashboard =====

export interface DashboardStats {
  todayRevenue: number;
  todayAppointments: number;
  newCustomers: number;
  activeEmployees: number;
  soldPackages: number;
  revenueGrowth: number;
  appointmentGrowth: number;
  customerGrowth: number;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  target: number;
}

export interface DailyAppointments {
  date: string;
  count: number;
}

export interface PopularService {
  name: string;
  count: number;
  revenue: number;
}

export interface TopEmployee {
  name: string;
  appointments: number;
  revenue: number;
  commission: number;
}

// ===== Report =====

export interface RevenueReport {
  period: string;
  revenue: number;
  orderCount: number;
  avgOrderValue: number;
}

export interface TopCustomer {
  customerId: string;
  name: string;
  totalSpent: number;
  orderCount: number;
  loyaltyPoints: number;
}

// ===== UI State =====

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export interface FilterState {
  search: string;
  [key: string]: unknown;
}
