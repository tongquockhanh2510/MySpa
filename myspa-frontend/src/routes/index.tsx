import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from '@hooks/useAppSelector';
import { ROUTES } from '@constants/routes';
import { getFirstAccessibleRoute, hasAnyRole, type RoleName } from '@utils/authorization';
import LoadingOverlay from '@components/common/LoadingOverlay';
import MainLayout from '@layouts/MainLayout';
import AuthLayout from '@layouts/AuthLayout';

// Lazy-loaded pages
const LoginPage = lazy(() => import('@features/auth/pages/LoginPage'));
const ForgotPasswordPage = lazy(() => import('@features/auth/pages/ForgotPasswordPage'));
const ProfilePage = lazy(() => import('@features/auth/pages/ProfilePage'));

const DashboardPage = lazy(() => import('@features/dashboard/pages/DashboardPage'));
const CustomersPage = lazy(() => import('@features/customers/pages/CustomersPage'));
const EmployeesPage = lazy(() => import('@features/employees/pages/EmployeesPage'));
const ServicesPage = lazy(() => import('@features/services/pages/ServicesPage'));
const AppointmentsPage = lazy(() => import('@features/appointments/pages/AppointmentsPage'));
const TreatmentPackagesPage = lazy(() => import('@features/treatment-packages/pages/TreatmentPackagesPage'));
const CustomerTreatmentsPage = lazy(() => import('@features/customer-treatments/pages/CustomerTreatmentsPage'));
const PackageConversionsPage = lazy(() => import('@features/package-conversions/pages/PackageConversionsPage'));
const OrdersPage = lazy(() => import('@features/orders/pages/OrdersPage'));
const ProductsPage = lazy(() => import('@features/products/pages/ProductsPage'));
const CategoriesPage = lazy(() => import('@features/categories/pages/CategoriesPage'));
const PromotionsPage = lazy(() => import('@features/promotions/pages/PromotionsPage'));
const SalariesPage = lazy(() => import('@features/salaries/pages/SalariesPage'));
const ReportsPage = lazy(() => import('@features/reports/pages/ReportsPage'));
const NotificationsPage = lazy(() => import('@features/notifications/pages/NotificationsPage'));
const UsersPage = lazy(() => import('@features/users/pages/UsersPage'));
const RolesPage = lazy(() => import('@features/roles/pages/RolesPage'));
const PermissionsPage = lazy(() => import('@features/permissions/pages/PermissionsPage'));
const SubscriptionsPage = lazy(() => import('@features/subscriptions/pages/SubscriptionsPage'));

// Protected route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAppSelector(s => s.auth);
  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace />;
  return <>{children}</>;
};

const RoleRoute: React.FC<{ children: React.ReactNode; allowedRoles?: RoleName[] }> = ({ children, allowedRoles }) => {
  const { user } = useAppSelector(s => s.auth);
  if (!hasAnyRole(user, allowedRoles)) return <UnauthorizedPage />;
  return <>{children}</>;
};

// Guest route wrapper (redirects authenticated users away from login)
const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAppSelector(s => s.auth);
  if (isAuthenticated) return <Navigate to={getFirstAccessibleRoute(user)} replace />;
  return <>{children}</>;
};

const AccessFallback: React.FC = () => {
  const { user } = useAppSelector(s => s.auth);
  return <Navigate to={getFirstAccessibleRoute(user)} replace />;
};

const SuspenseWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<LoadingOverlay message="Đang tải trang..." />}>
    {children}
  </Suspense>
);

const UnauthorizedPage: React.FC = () => {
  const { user } = useAppSelector(s => s.auth);

  return (
    <div style={{
      minHeight: 360,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 12,
      textAlign: 'center',
      color: 'var(--text-secondary)',
    }}>
      <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: 22 }}>Khong co quyen truy cap</h2>
      <p style={{ margin: 0, maxWidth: 460 }}>Tai khoan hien tai khong duoc phep mo chuc nang nay.</p>
      <a
        href={getFirstAccessibleRoute(user)}
        style={{
          marginTop: 8,
          color: '#fff',
          background: 'linear-gradient(135deg, #D97706, #F59E0B)',
          padding: '10px 16px',
          borderRadius: 10,
          fontWeight: 700,
          textDecoration: 'none',
        }}
      >
        Ve trang duoc phep
      </a>
    </div>
  );
};

const withRole = (element: React.ReactNode, allowedRoles?: RoleName[]) => (
  <RoleRoute allowedRoles={allowedRoles}>
    <SuspenseWrapper>{element}</SuspenseWrapper>
  </RoleRoute>
);

const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes */}
        <Route element={<GuestRoute><AuthLayout /></GuestRoute>}>
          <Route path={ROUTES.LOGIN} element={<SuspenseWrapper><LoginPage /></SuspenseWrapper>} />
          <Route path={ROUTES.FORGOT_PASSWORD} element={<SuspenseWrapper><ForgotPasswordPage /></SuspenseWrapper>} />
        </Route>

        {/* Protected main routes */}
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path={ROUTES.DASHBOARD} element={withRole(<DashboardPage />, ['ADMIN', 'MANAGER'])} />
          <Route path={ROUTES.CUSTOMERS} element={withRole(<CustomersPage />, ['ADMIN', 'MANAGER', 'RECEPTIONIST'])} />
          <Route path={ROUTES.EMPLOYEES} element={withRole(<EmployeesPage />, ['ADMIN', 'MANAGER', 'RECEPTIONIST', 'THERAPIST'])} />
          <Route path={ROUTES.SERVICES} element={withRole(<ServicesPage />, ['ADMIN', 'MANAGER', 'RECEPTIONIST', 'THERAPIST'])} />
          <Route path={ROUTES.APPOINTMENTS} element={withRole(<AppointmentsPage />, ['ADMIN', 'MANAGER', 'RECEPTIONIST', 'THERAPIST'])} />
          <Route path={ROUTES.TREATMENT_PACKAGES} element={withRole(<TreatmentPackagesPage />, ['ADMIN', 'MANAGER', 'RECEPTIONIST', 'THERAPIST'])} />
          <Route path={ROUTES.CUSTOMER_TREATMENTS} element={withRole(<CustomerTreatmentsPage />, ['ADMIN', 'MANAGER', 'RECEPTIONIST'])} />
          <Route path={ROUTES.PACKAGE_CONVERSIONS} element={withRole(<PackageConversionsPage />, ['ADMIN', 'MANAGER', 'RECEPTIONIST'])} />
          <Route path={ROUTES.ORDERS} element={withRole(<OrdersPage />, ['ADMIN', 'MANAGER', 'RECEPTIONIST'])} />
          <Route path={ROUTES.PRODUCTS} element={withRole(<ProductsPage />, ['ADMIN', 'MANAGER', 'RECEPTIONIST', 'THERAPIST'])} />
          <Route path={ROUTES.CATEGORIES} element={withRole(<CategoriesPage />, ['ADMIN', 'MANAGER', 'RECEPTIONIST', 'THERAPIST'])} />
          <Route path={ROUTES.PROMOTIONS} element={withRole(<PromotionsPage />, ['ADMIN', 'MANAGER', 'RECEPTIONIST'])} />
          <Route path={ROUTES.SALARIES} element={withRole(<SalariesPage />, ['ADMIN', 'MANAGER', 'RECEPTIONIST', 'THERAPIST'])} />
          <Route path={ROUTES.REPORTS} element={withRole(<ReportsPage />, ['ADMIN', 'MANAGER'])} />
          <Route path={ROUTES.NOTIFICATIONS} element={withRole(<NotificationsPage />, ['ADMIN', 'MANAGER', 'RECEPTIONIST', 'THERAPIST'])} />
          <Route path={ROUTES.USERS} element={withRole(<UsersPage />, ['ADMIN'])} />
          <Route path={ROUTES.ROLES} element={withRole(<RolesPage />, ['ADMIN'])} />
          <Route path={ROUTES.PERMISSIONS} element={withRole(<PermissionsPage />, ['ADMIN'])} />
          <Route path={ROUTES.SUBSCRIPTIONS} element={withRole(<SubscriptionsPage />, ['ADMIN'])} />
          <Route path={ROUTES.PROFILE} element={<SuspenseWrapper><ProfilePage /></SuspenseWrapper>} />

          {/* Fallback */}
          <Route path="*" element={<AccessFallback />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
