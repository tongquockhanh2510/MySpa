import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ROUTES } from '@constants/routes';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import StatusChip from '@components/common/StatusChip';
import { formatCurrency } from '@utils/formatters';
import type { DashboardStats } from '../hooks/useDashboardData';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PeopleIcon from '@mui/icons-material/People';
import BadgeIcon from '@mui/icons-material/Badge';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';
import RefreshIcon from '@mui/icons-material/Refresh';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import './DashboardPage.mobile.css';

interface DashboardPageMobileProps {
  stats: DashboardStats;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  loadDashboard: (isRefresh?: boolean) => void;
  monthlyRevenue: { month: string; revenue: number; profit: number; orderCount: number }[];
  popularServices: { name: string; count: number; revenue: number }[];
  lowStockProducts: any[];
  recentOrders: any[];
  totalPopularBookings: number;
  revenueDelta: number;
}

const miniStats = (stats: DashboardStats) => [
  { key: 'today', title: 'Hôm nay', value: formatCurrency(Number(stats.todayRevenue || 0)), icon: <AttachMoneyIcon fontSize="small" />, color: '#D97706', path: ROUTES.ORDERS },
  { key: 'appt', title: 'Lịch hẹn hôm nay', value: String(Number(stats.todayAppointments || 0)), icon: <CalendarMonthIcon fontSize="small" />, color: '#2563EB', path: ROUTES.APPOINTMENTS },
  { key: 'customers', title: 'KH mới tháng này', value: String(Number(stats.newCustomersThisMonth || 0)), icon: <PeopleIcon fontSize="small" />, color: '#10B981', path: ROUTES.CUSTOMERS },
  { key: 'employees', title: 'NV đang làm', value: `${Number(stats.activeEmployees || 0)}/${Number(stats.totalEmployees || 0)}`, icon: <BadgeIcon fontSize="small" />, color: '#7C3AED', path: ROUTES.EMPLOYEES },
  { key: 'packages', title: 'Gói đã bán tháng này', value: String(Number(stats.soldPackagesThisMonth || 0)), icon: <FolderSpecialIcon fontSize="small" />, color: '#DC2626', path: ROUTES.CUSTOMER_TREATMENTS },
];

const DashboardPageMobile: React.FC<DashboardPageMobileProps> = ({
  stats, loading, refreshing, error, loadDashboard,
  monthlyRevenue, popularServices, lowStockProducts, recentOrders,
  totalPopularBookings, revenueDelta,
}) => {
  const navigate = useNavigate();

  return (
    <main className="dashboard-m animate-fadeIn">
      <div className="dashboard-m__header">
        <div>
          <p className="dashboard-m__kicker">Tổng quan vận hành</p>
          <h1>Bảng điều khiển</h1>
        </div>
        <IconButton
          onClick={() => loadDashboard(true)}
          disabled={loading || refreshing}
          size="small"
          aria-label="Làm mới"
          sx={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px' }}
        >
          <RefreshIcon fontSize="small" />
        </IconButton>
      </div>

      {error && <Alert severity="warning" className="dashboard-m__alert">{error}</Alert>}

      <section className="dashboard-m__hero">
        <div className="dashboard-m__hero-top">
          <span aria-hidden="true">{revenueDelta >= 0 ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />}</span>
          <span>Doanh thu tháng này</span>
        </div>
        <strong>{loading ? '...' : formatCurrency(Number(stats.monthRevenue || 0))}</strong>
        <span className="dashboard-m__hero-delta" style={{ color: revenueDelta >= 0 ? 'var(--success)' : 'var(--error)' }}>
          {revenueDelta >= 0 ? '▲ +' : '▼ '}{formatCurrency(revenueDelta)} so với tháng trước
        </span>
        <div className="dashboard-m__hero-grid">
          <div>
            <span>Tiền thực thu</span>
            <strong>{formatCurrency(Number(stats.monthCollected || 0))}</strong>
          </div>
          <div>
            <span>Cần nhập kho</span>
            <strong>{Number(stats.lowStockProducts || 0)}</strong>
          </div>
        </div>
      </section>

      <section className="dashboard-m__stats" aria-label="Chỉ số chính">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} variant="rounded" height={64} />)
        ) : (
          miniStats(stats).map((item) => (
            <button key={item.key} className="dashboard-m__stat-row" onClick={() => navigate(item.path)}>
              <span className="dashboard-m__stat-icon" style={{ background: `${item.color}1A`, color: item.color }} aria-hidden="true">
                {item.icon}
              </span>
              <span className="dashboard-m__stat-label">{item.title}</span>
              <strong className="dashboard-m__stat-value">{item.value}</strong>
              <ChevronRightIcon fontSize="small" className="dashboard-m__stat-chevron" />
            </button>
          ))
        )}
      </section>

      <section className="dashboard-m__panel">
        <div className="dashboard-m__panel-header">
          <h2>Doanh thu 12 tháng</h2>
          <button onClick={() => navigate(ROUTES.REPORTS)}>Xem báo cáo</button>
        </div>
        <div className="dashboard-m__chart">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyRevenue} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
              <defs>
                <linearGradient id="dashboardMobileRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D97706" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#D97706" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} interval={1} />
              <Tooltip formatter={(value: any) => formatCurrency(Number(value))} contentStyle={{ borderRadius: 10, fontSize: 12, border: '1px solid var(--border-color)' }} />
              <Area type="monotone" dataKey="revenue" name="Doanh thu" stroke="#D97706" strokeWidth={2.5} fill="url(#dashboardMobileRevenueGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="dashboard-m__panel">
        <div className="dashboard-m__panel-header">
          <h2>Dịch vụ phổ biến</h2>
          <button onClick={() => navigate(ROUTES.SERVICES)}>Xem tất cả</button>
        </div>
        {popularServices.length ? (
          <div className="dashboard-m__list">
            {popularServices.map((service, index) => (
              <div className="dashboard-m__list-row" key={`${service.name}-${index}`}>
                <div className="dashboard-m__list-main">
                  <strong>{service.name}</strong>
                  <span>{service.count} lượt - {formatCurrency(service.revenue)}</span>
                </div>
              </div>
            ))}
            <p className="dashboard-m__list-total">{totalPopularBookings} lượt đặt trong kỳ</p>
          </div>
        ) : (
          <p className="dashboard-m__empty">Chưa có dữ liệu dịch vụ.</p>
        )}
      </section>

      <section className="dashboard-m__panel">
        <div className="dashboard-m__panel-header">
          <h2>Đơn hàng gần đây</h2>
          <button onClick={() => navigate(ROUTES.ORDERS)}>Xem tất cả</button>
        </div>
        <div className="dashboard-m__list">
          {recentOrders.map((order) => (
            <div
              key={order.orderId}
              className="dashboard-m__list-row dashboard-m__list-row--clickable"
              role="button"
              tabIndex={0}
              onClick={() => navigate(ROUTES.ORDERS)}
            >
              <div className="dashboard-m__list-main">
                <strong>{order.customerName || 'Khách lẻ'}</strong>
                <span>{formatCurrency(Number(order.totalAmount || 0))}</span>
              </div>
              <StatusChip status={order.orderStatus} type="order" />
            </div>
          ))}
          {!recentOrders.length && (
            <p className="dashboard-m__empty">
              <ReceiptLongIcon fontSize="small" /> {loading ? 'Đang tải đơn hàng...' : 'Chưa có đơn hàng'}
            </p>
          )}
        </div>
      </section>

      <section className="dashboard-m__panel">
        <div className="dashboard-m__panel-header">
          <h2>Sản phẩm sắp hết hàng</h2>
          <button onClick={() => navigate(ROUTES.PRODUCTS)}>Xem tất cả</button>
        </div>
        <div className="dashboard-m__list">
          {lowStockProducts.map((product: any) => {
            const critical = Number(product.currentStock || 0) <= 3;
            return (
              <div
                key={product.productId || product.productName}
                className="dashboard-m__list-row dashboard-m__list-row--clickable"
                role="button"
                tabIndex={0}
                onClick={() => navigate(ROUTES.PRODUCTS)}
              >
                <div className="dashboard-m__list-main">
                  <strong>{product.productName}</strong>
                  <span>{product.brand || 'Chưa có thương hiệu'}</span>
                </div>
                <span className={critical ? 'dashboard-m__stock dashboard-m__stock--critical' : 'dashboard-m__stock'}>
                  {critical && <WarningAmberIcon fontSize="small" />}
                  Còn {Number(product.currentStock || 0)}
                </span>
              </div>
            );
          })}
          {!lowStockProducts.length && (
            <p className="dashboard-m__empty">
              <Inventory2Icon fontSize="small" /> {loading ? 'Đang kiểm tra tồn kho...' : 'Kho hàng ổn định'}
            </p>
          )}
        </div>
      </section>
    </main>
  );
};

export default DashboardPageMobile;
