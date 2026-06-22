import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from '@hooks/useAppSelector';
import { ROUTES } from '@constants/routes';
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
const UsersPage = lazy(() => import('@features/users/pages/UsersPage'));
const RolesPage = lazy(() => import('@features/roles/pages/RolesPage'));
const PermissionsPage = lazy(() => import('@features/permissions/pages/PermissionsPage'));

// Protected route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAppSelector(s => s.auth);
  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace />;
  return <>{children}</>;
};

// Guest route wrapper (redirects authenticated users away from login)
const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAppSelector(s => s.auth);
  if (isAuthenticated) return <Navigate to={ROUTES.DASHBOARD} replace />;
  return <>{children}</>;
};

const SuspenseWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<LoadingOverlay message="Đang tải trang..." />}>
    {children}
  </Suspense>
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
          <Route path={ROUTES.DASHBOARD} element={<SuspenseWrapper><DashboardPage /></SuspenseWrapper>} />
          <Route path={ROUTES.CUSTOMERS} element={<SuspenseWrapper><CustomersPage /></SuspenseWrapper>} />
          <Route path={ROUTES.EMPLOYEES} element={<SuspenseWrapper><EmployeesPage /></SuspenseWrapper>} />
          <Route path={ROUTES.SERVICES} element={<SuspenseWrapper><ServicesPage /></SuspenseWrapper>} />
          <Route path={ROUTES.APPOINTMENTS} element={<SuspenseWrapper><AppointmentsPage /></SuspenseWrapper>} />
          <Route path={ROUTES.TREATMENT_PACKAGES} element={<SuspenseWrapper><TreatmentPackagesPage /></SuspenseWrapper>} />
          <Route path={ROUTES.CUSTOMER_TREATMENTS} element={<SuspenseWrapper><CustomerTreatmentsPage /></SuspenseWrapper>} />
          <Route path={ROUTES.PACKAGE_CONVERSIONS} element={<SuspenseWrapper><PackageConversionsPage /></SuspenseWrapper>} />
          <Route path={ROUTES.ORDERS} element={<SuspenseWrapper><OrdersPage /></SuspenseWrapper>} />
          <Route path={ROUTES.PRODUCTS} element={<SuspenseWrapper><ProductsPage /></SuspenseWrapper>} />
          <Route path={ROUTES.CATEGORIES} element={<SuspenseWrapper><CategoriesPage /></SuspenseWrapper>} />
          <Route path={ROUTES.PROMOTIONS} element={<SuspenseWrapper><PromotionsPage /></SuspenseWrapper>} />
          <Route path={ROUTES.SALARIES} element={<SuspenseWrapper><SalariesPage /></SuspenseWrapper>} />
          <Route path={ROUTES.REPORTS} element={<SuspenseWrapper><ReportsPage /></SuspenseWrapper>} />
          <Route path={ROUTES.USERS} element={<SuspenseWrapper><UsersPage /></SuspenseWrapper>} />
          <Route path={ROUTES.ROLES} element={<SuspenseWrapper><RolesPage /></SuspenseWrapper>} />
          <Route path={ROUTES.PERMISSIONS} element={<SuspenseWrapper><PermissionsPage /></SuspenseWrapper>} />
          <Route path={ROUTES.PROFILE} element={<SuspenseWrapper><ProfilePage /></SuspenseWrapper>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
