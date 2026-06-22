// ============================================================
// Route Path Constants
// ============================================================

export const ROUTES = {
  // Auth
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  
  // Dashboard
  DASHBOARD: '/',

  // Customers
  CUSTOMERS: '/khach-hang',
  CUSTOMER_DETAIL: '/khach-hang/:id',

  // Employees
  EMPLOYEES: '/nhan-vien',
  EMPLOYEE_DETAIL: '/nhan-vien/:id',

  // Services
  SERVICES: '/dich-vu',

  // Appointments
  APPOINTMENTS: '/lich-hen',
  APPOINTMENT_CALENDAR: '/lich-hen/lich',

  // Treatment Packages
  TREATMENT_PACKAGES: '/goi-lieu-trinh',

  // Customer Treatments
  CUSTOMER_TREATMENTS: '/lieu-trinh-khach-hang',

  // Package Conversions
  PACKAGE_CONVERSIONS: '/chuyen-doi-lieu-trinh',

  // Orders
  ORDERS: '/don-hang',
  ORDER_DETAIL: '/don-hang/:id',

  // Products
  PRODUCTS: '/san-pham',

  // Categories
  CATEGORIES: '/danh-muc',

  // Promotions
  PROMOTIONS: '/khuyen-mai',

  // Salaries
  SALARIES: '/luong-nhan-vien',

  // Reports
  REPORTS: '/bao-cao',

  // User Management
  USERS: '/nguoi-dung',
  ROLES: '/vai-tro',
  PERMISSIONS: '/phan-quyen',

  // Profile
  PROFILE: '/ho-so',
  CHANGE_PASSWORD: '/doi-mat-khau',
} as const;

export type RouteKey = keyof typeof ROUTES;
