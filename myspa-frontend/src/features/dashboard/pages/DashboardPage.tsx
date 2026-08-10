import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, PieChart, Pie, Cell, Legend,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { ROUTES } from '@constants/routes';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import StatCard from '@components/common/StatCard';
import StatusChip from '@components/common/StatusChip';
import { formatCurrency } from '@utils/formatters';
import { useIsMobile } from '@hooks/useIsMobile';
import { useDashboardData } from '../hooks/useDashboardData';
import DashboardPageMobile from './DashboardPage.mobile';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PeopleIcon from '@mui/icons-material/People';
import BadgeIcon from '@mui/icons-material/Badge';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';
import RefreshIcon from '@mui/icons-material/Refresh';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SpaIcon from '@mui/icons-material/Spa';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import './DashboardPage.css';

const CHART_COLORS = ['#D97706', '#2563EB', '#10B981', '#7C3AED', '#DC2626'];

const formatShortCurrency = (value: number) => {
  if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
  if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return `${value}`;
};

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="dashboard-tooltip">
      {label && <p className="dashboard-tooltip__label">{label}</p>}
      {payload.map((entry, index) => (
        <p key={`${entry.name}-${index}`} className="dashboard-tooltip__value">
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
};

const SectionPanel: React.FC<{
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, subtitle, icon, action, children }) => (
  <section className="dashboard-panel">
    <div className="dashboard-panel__header">
      <div className="dashboard-panel__title-group">
        {icon && <span className="dashboard-panel__icon" aria-hidden="true">{icon}</span>}
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
    {children}
  </section>
);

const EmptyState: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="dashboard-empty" role="status">
    <span className="dashboard-empty__icon" aria-hidden="true">{icon}</span>
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
);

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const {
    stats, loading, refreshing, error, loadDashboard,
    monthlyRevenue, popularServices, lowStockProducts, recentOrders,
    totalPopularBookings, revenueDelta,
  } = useDashboardData();

  if (isMobile) {
    return (
      <DashboardPageMobile
        stats={stats}
        loading={loading}
        refreshing={refreshing}
        error={error}
        loadDashboard={loadDashboard}
        monthlyRevenue={monthlyRevenue}
        popularServices={popularServices}
        lowStockProducts={lowStockProducts}
        recentOrders={recentOrders}
        totalPopularBookings={totalPopularBookings}
        revenueDelta={revenueDelta}
      />
    );
  }

  return (
    <main className="dashboard-page animate-fadeIn">
      <div className="dashboard-header">
        <div>
          <p className="dashboard-kicker">Tổng quan vận hành</p>
          <h1>Bảng điều khiển Spa</h1>
          <p>
            Cập nhật hôm nay, {new Date().toLocaleDateString('vi-VN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => loadDashboard(true)}
          disabled={loading || refreshing}
          sx={{
            borderRadius: '10px',
            textTransform: 'none',
            fontFamily: 'inherit',
            fontWeight: 700,
            borderColor: 'var(--border-color)',
            color: 'var(--text-secondary)',
            background: 'var(--bg-card)',
            '&:hover': {
              borderColor: 'var(--primary)',
              background: 'var(--primary-50)',
            },
          }}
        >
          {refreshing ? 'Đang tải...' : 'Làm mới'}
        </Button>
      </div>

      {error && (
        <Alert severity="warning" className="dashboard-alert">
          {error}
        </Alert>
      )}

      <section className="dashboard-hero" aria-label="Tóm tắt kinh doanh">
        <div className="dashboard-hero__main">
          <span className="dashboard-hero__icon" aria-hidden="true">{revenueDelta >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}</span>
          <div>
            <p>Doanh thu ghi nhận tháng này</p>
            <strong>{loading ? '...' : formatCurrency(Number(stats.monthRevenue || 0))}</strong>
            <span style={{ color: revenueDelta >= 0 ? 'var(--success)' : 'var(--error)', fontWeight: 700 }}>
              {revenueDelta >= 0 ? '▲ +' : '▼ '}{formatCurrency(revenueDelta)} so với tháng trước
            </span>
          </div>
        </div>
        <div className="dashboard-hero__metrics">
          <div title="Tổng tiền đã nhận trong tháng, gồm cả các đơn thanh toán một phần">
            <span>Tiền thực thu</span>
            <strong>{formatCurrency(Number(stats.monthCollected || 0))}</strong>
          </div>
          <div title="Giá trị buổi gói đã bán nhưng khách chưa sử dụng (doanh thu chưa thực hiện)">
            <span>Chưa thực hiện</span>
            <strong>{formatCurrency(Number(stats.unearnedRevenue || 0))}</strong>
          </div>
          <div>
            <span>Lịch hẹn tháng</span>
            <strong>{Number(stats.monthAppointments || 0)}</strong>
          </div>
          <div>
            <span>Cần nhập kho</span>
            <strong>{Number(stats.lowStockProducts || 0)}</strong>
          </div>
        </div>
      </section>

      <section className="dashboard-stats" aria-label="Chỉ số chính">
        {loading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} variant="rounded" height={154} className="dashboard-skeleton" />
          ))
        ) : (
          <>
            <StatCard title="Doanh thu hôm nay" value={Number(stats.todayRevenue || 0)} format="currency" icon={<AttachMoneyIcon />} color="#D97706" trend={stats.todayRevenueGrowthPercent == null ? undefined : Math.round(Number(stats.todayRevenueGrowthPercent))} trendLabel="so với cùng ngày tuần trước" onClick={() => navigate(ROUTES.ORDERS)} />
            <StatCard title="Lịch hẹn hôm nay" value={Number(stats.todayAppointments || 0)} icon={<CalendarMonthIcon />} color="#2563EB" subtitle="buổi cần phục vụ" onClick={() => navigate(ROUTES.APPOINTMENTS)} />
            <StatCard title="Khách hàng mới" value={Number(stats.newCustomersThisMonth || 0)} icon={<PeopleIcon />} color="#10B981" trend={stats.customerGrowthPercent == null ? undefined : Math.round(Number(stats.customerGrowthPercent))} subtitle="trong tháng này" onClick={() => navigate(ROUTES.CUSTOMERS)} />
            <StatCard title="Nhân viên đang làm" value={Number(stats.activeEmployees || 0)} icon={<BadgeIcon />} color="#7C3AED" subtitle={`/${Number(stats.totalEmployees || 0)} người`} onClick={() => navigate(ROUTES.EMPLOYEES)} />
            <StatCard title="Gói liệu trình đã bán" value={Number(stats.soldPackagesThisMonth || 0)} icon={<FolderSpecialIcon />} color="#DC2626" subtitle="trong tháng này" onClick={() => navigate(ROUTES.CUSTOMER_TREATMENTS)} />
          </>
        )}
      </section>

      <div className="dashboard-grid dashboard-grid--charts">
        <SectionPanel
          title="Doanh thu và lợi nhuận"
          subtitle="12 tháng, theo hóa đơn đã thanh toán"
          icon={<AttachMoneyIcon />}
          action={
            <Button size="small" onClick={() => navigate(ROUTES.REPORTS)} sx={{ textTransform: 'none', fontFamily: 'inherit', fontWeight: 600, color: 'var(--primary)' }}>
              Xem báo cáo
            </Button>
          }
        >
          <div className="dashboard-chart-summary">
            <div>
              <span>Năm nay</span>
              <strong>{formatCurrency(Number(stats.yearRevenue || 0))}</strong>
            </div>
            <div>
              <span>Tháng hiện tại</span>
              <strong>{formatCurrency(Number(stats.monthRevenue || 0))}</strong>
            </div>
          </div>
          <div className="dashboard-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenue} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="dashboardRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D97706" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#D97706" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="dashboardProfitGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
                <YAxis width={44} tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} tickFormatter={(value) => formatShortCurrency(Number(value))} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" name="Doanh thu" stroke="#D97706" strokeWidth={3} fill="url(#dashboardRevenueGradient)" dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 5 }} />
                <Area type="monotone" dataKey="profit" name="Lợi nhuận" stroke="#10B981" strokeWidth={2.5} fill="url(#dashboardProfitGradient)" dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionPanel>

        <SectionPanel
          title="Dịch vụ phổ biến"
          subtitle="Theo lượt đặt trong kỳ"
          icon={<SpaIcon />}
          action={
            <Button size="small" onClick={() => navigate(ROUTES.SERVICES)} sx={{ textTransform: 'none', fontFamily: 'inherit', fontWeight: 600, color: 'var(--primary)' }}>
              Xem tất cả
            </Button>
          }
        >
          {popularServices.length ? (
            <div className="dashboard-service-layout">
              <div className="dashboard-donut">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={popularServices} cx="50%" cy="50%" innerRadius={56} outerRadius={84} paddingAngle={3} dataKey="count" nameKey="name">
                      {popularServices.map((_, index) => <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value: any, name: any) => [`${value} lượt`, name]} contentStyle={{ borderRadius: 10, fontSize: 12, border: '1px solid var(--border-color)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="dashboard-donut__center">
                  <strong>{totalPopularBookings}</strong>
                  <span>lượt</span>
                </div>
              </div>
              <div className="dashboard-service-list">
                {popularServices.map((service, index) => (
                  <div className="dashboard-service-row" key={`${service.name}-${index}`}>
                    <span style={{ background: CHART_COLORS[index % CHART_COLORS.length] }} aria-hidden="true" />
                    <div>
                      <strong>{service.name}</strong>
                      <small>{service.count} lượt - {formatCurrency(service.revenue)}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState icon={<SpaIcon />} title="Chưa có dữ liệu dịch vụ" description="Dịch vụ phổ biến sẽ xuất hiện khi có lịch đặt hoặc hóa đơn mới." />
          )}
        </SectionPanel>
      </div>

      <div className="dashboard-grid dashboard-grid--lists">
        <SectionPanel
          title="Đơn hàng gần đây"
          subtitle={`${recentOrders.length} đơn hàng mới nhất`}
          icon={<ReceiptLongIcon />}
          action={
            <Button size="small" onClick={() => navigate(ROUTES.ORDERS)} sx={{ textTransform: 'none', fontFamily: 'inherit', fontWeight: 600, color: 'var(--primary)' }}>
              Xem tất cả
            </Button>
          }
        >
          <div className="dashboard-list">
            {recentOrders.map((order) => (
              <div
                key={order.orderId}
                className="dashboard-list-row dashboard-list-row--clickable"
                role="button"
                tabIndex={0}
                onClick={() => navigate(ROUTES.ORDERS)}
                onKeyDown={(e) => { if (e.key === 'Enter') navigate(ROUTES.ORDERS); }}
              >
                <div className="dashboard-list-row__main">
                  <strong>{order.customerName || 'Khách lẻ'}</strong>
                  <span>{formatCurrency(Number(order.totalAmount || 0))}</span>
                </div>
                <StatusChip status={order.orderStatus} type="order" />
              </div>
            ))}
            {!recentOrders.length && (
              <EmptyState icon={<ReceiptLongIcon />} title={loading ? 'Đang tải đơn hàng' : 'Chưa có đơn hàng'} description={loading ? 'Dữ liệu đang được đồng bộ từ hệ thống.' : 'Các đơn hàng mới sẽ hiển thị tại đây.'} />
            )}
          </div>
        </SectionPanel>

        <SectionPanel
          title="Sản phẩm sắp hết hàng"
          subtitle={`${Number(stats.lowStockProducts || 0)} sản phẩm cần chú ý`}
          icon={<Inventory2Icon />}
          action={
            <Button size="small" onClick={() => navigate(ROUTES.PRODUCTS)} sx={{ textTransform: 'none', fontFamily: 'inherit', fontWeight: 600, color: 'var(--primary)' }}>
              Xem tất cả
            </Button>
          }
        >
          <div className="dashboard-list">
            {lowStockProducts.map((product: any) => {
              const critical = Number(product.currentStock || 0) <= 3;
              return (
                <div
                  key={product.productId || product.productName}
                  className="dashboard-list-row dashboard-list-row--clickable"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(ROUTES.PRODUCTS)}
                  onKeyDown={(e) => { if (e.key === 'Enter') navigate(ROUTES.PRODUCTS); }}
                >
                  <div className="dashboard-list-row__main">
                    <strong>{product.productName}</strong>
                    <span>{product.brand || 'Chưa có thương hiệu'}</span>
                  </div>
                  <span className={critical ? 'dashboard-stock dashboard-stock--critical' : 'dashboard-stock'}>
                    {critical && <WarningAmberIcon />}
                    Còn {Number(product.currentStock || 0)}
                  </span>
                </div>
              );
            })}
            {!lowStockProducts.length && (
              <EmptyState icon={<Inventory2Icon />} title={loading ? 'Đang tải tồn kho' : 'Kho hàng ổn định'} description={loading ? 'Đang kiểm tra các sản phẩm tồn kho thấp.' : 'Không có sản phẩm nào dưới ngưỡng cảnh báo.'} />
            )}
          </div>
        </SectionPanel>
      </div>
    </main>
  );
};

export default DashboardPage;
