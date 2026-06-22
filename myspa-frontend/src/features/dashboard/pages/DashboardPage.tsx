import React from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';
import StatCard from '@components/common/StatCard';
import StatusChip from '@components/common/StatusChip';
import {
  mockDashboardStats,
  mockMonthlyRevenue,
  mockDailyAppointments,
  mockPopularServices,
  mockTopEmployees,
  mockAppointments,
  mockOrders,
  mockProducts,
} from '@utils/mockData';
import { formatCurrency } from '@utils/formatters';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PeopleIcon from '@mui/icons-material/People';
import BadgeIcon from '@mui/icons-material/Badge';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';
import { LOW_STOCK_THRESHOLD } from '@constants/config';

const CHART_COLORS = ['#D97706', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 10,
        padding: '10px 14px',
        boxShadow: 'var(--shadow-lg)',
      }}>
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 6 }}>{label}</p>
        {payload.map((entry, i) => (
          <p key={i} style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            {entry.name === 'revenue' || entry.name === 'Doanh thu' || entry.name === 'Mục tiêu'
              ? formatCurrency(entry.value)
              : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const SectionCard: React.FC<{ title: string; subtitle?: string; children: React.ReactNode; style?: React.CSSProperties }> = ({
  title, subtitle, children, style
}) => (
  <div style={{
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow-card)',
    padding: '20px 24px',
    ...style,
  }}>
    <div style={{ marginBottom: 16 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{title}</h3>
      {subtitle && <p style={{ fontSize: 12.5, color: 'var(--text-tertiary)' }}>{subtitle}</p>}
    </div>
    {children}
  </div>
);

const DashboardPage: React.FC = () => {
  const stats = mockDashboardStats;
  const lowStockProducts = mockProducts.filter(p => p.stockQuantity <= LOW_STOCK_THRESHOLD);
  const upcomingAppointments = mockAppointments
    .filter(a => ['PENDING', 'CONFIRMED'].includes(a.statusOfAppointment))
    .slice(0, 5);
  const recentOrders = mockOrders.slice(0, 5);

  return (
    <div className="animate-fadeIn">
      {/* Page title */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px', marginBottom: 4 }}>
          Bảng điều khiển
        </h1>
        <p style={{ fontSize: 13.5, color: 'var(--text-tertiary)' }}>
          Tổng quan hoạt động hôm nay — {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
        marginBottom: 24,
      }}>
        <div className="stagger-1">
          <StatCard
            title="Doanh thu hôm nay"
            value={stats.todayRevenue}
            format="currency"
            icon={<AttachMoneyIcon />}
            color="#D97706"
            trend={stats.revenueGrowth}
          />
        </div>
        <div className="stagger-2">
          <StatCard
            title="Lịch hẹn hôm nay"
            value={stats.todayAppointments}
            icon={<CalendarMonthIcon />}
            color="#3B82F6"
            trend={stats.appointmentGrowth}
            subtitle="buổi"
          />
        </div>
        <div className="stagger-3">
          <StatCard
            title="Khách hàng mới"
            value={stats.newCustomers}
            icon={<PeopleIcon />}
            color="#10B981"
            trend={stats.customerGrowth}
            subtitle="trong tháng này"
          />
        </div>
        <div className="stagger-4">
          <StatCard
            title="Nhân viên đang làm"
            value={stats.activeEmployees}
            icon={<BadgeIcon />}
            color="#8B5CF6"
            subtitle="người"
          />
        </div>
        <div className="stagger-5">
          <StatCard
            title="Gói liệu trình đã bán"
            value={stats.soldPackages}
            icon={<FolderSpecialIcon />}
            color="#F59E0B"
            subtitle="trong tháng này"
          />
        </div>
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Revenue Area Chart */}
        <SectionCard title="Doanh thu 12 tháng" subtitle="So sánh doanh thu thực tế và mục tiêu">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={mockMonthlyRevenue} margin={{ top: 5, right: 10, bottom: 0, left: 10 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D97706" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#D97706" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="targetGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} formatter={(v) => v === 'revenue' ? 'Doanh thu' : 'Mục tiêu'} />
              <Area type="monotone" dataKey="revenue" name="revenue" stroke="#D97706" strokeWidth={2.5} fill="url(#revenueGrad)" dot={false} />
              <Area type="monotone" dataKey="target" name="target" stroke="#3B82F6" strokeWidth={2} fill="url(#targetGrad)" strokeDasharray="5 3" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </SectionCard>

        {/* Popular Services Pie Chart */}
        <SectionCard title="Dịch vụ phổ biến" subtitle="Tháng này">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={mockPopularServices}
                cx="50%"
                cy="45%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="count"
                nameKey="name"
              >
                {mockPopularServices.map((_, index) => (
                  <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any, name: any) => [`${value} lượt`, name]}
                contentStyle={{ borderRadius: 10, fontSize: 12, border: '1px solid var(--border-color)' }}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Daily Appointments Bar Chart */}
        <SectionCard title="Lịch hẹn theo ngày" subtitle="Tuần hiện tại">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={mockDailyAppointments} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12, border: '1px solid var(--border-color)' }} formatter={(v) => [`${v} lịch hẹn`, '']} />
              <Bar dataKey="count" fill="#D97706" radius={[6, 6, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        {/* Top Employees Radar Chart */}
        <SectionCard title="Nhân viên xuất sắc" subtitle="Đánh giá hiệu suất tháng này">
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={mockTopEmployees.map(e => ({
              name: e.name.split(' ').slice(-1)[0],
              'Lịch hẹn': e.appointments,
              'Doanh thu': Math.round(e.revenue / 1000000),
            }))}>
              <PolarGrid stroke="var(--divider)" />
              <PolarAngleAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
              <Radar dataKey="Lịch hẹn" stroke="#D97706" fill="#D97706" fillOpacity={0.2} />
              <Radar dataKey="Doanh thu" stroke="#10B981" fill="#10B981" fillOpacity={0.15} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>

      {/* Tables Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        {/* Upcoming Appointments */}
        <SectionCard title="Lịch hẹn sắp tới" subtitle={`${upcomingAppointments.length} lịch hẹn`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {upcomingAppointments.map((apt) => (
              <div key={apt.appointmentId} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: '1px solid var(--divider)',
              }}>
                <div>
                  <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                    {apt.customerName}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                    {new Date(apt.dateTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <StatusChip status={apt.statusOfAppointment} type="appointment" />
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Recent Orders */}
        <SectionCard title="Đơn hàng gần đây" subtitle={`${recentOrders.length} đơn hàng`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentOrders.map((order) => (
              <div key={order.orderId} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: '1px solid var(--divider)',
              }}>
                <div>
                  <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                    {order.customerName}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>
                    {formatCurrency(order.totalAmount)}
                  </p>
                </div>
                <StatusChip status={order.orderStatus} type="order" />
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Low Stock Products */}
        <SectionCard title="Sản phẩm sắp hết hàng" subtitle={`${lowStockProducts.length} sản phẩm cần nhập`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {lowStockProducts.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', padding: '16px 0' }}>
                ✅ Kho hàng đang ổn định
              </p>
            ) : (
              lowStockProducts.map((product) => (
                <div key={product.productId} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid var(--divider)',
                }}>
                  <div>
                    <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                      {product.name}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{product.brand}</p>
                  </div>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: product.stockQuantity <= 3 ? '#EF4444' : '#F59E0B',
                    background: product.stockQuantity <= 3 ? '#FEE2E2' : '#FEF3C7',
                    padding: '2px 8px',
                    borderRadius: 6,
                  }}>
                    Còn {product.stockQuantity}
                  </span>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

export default DashboardPage;
