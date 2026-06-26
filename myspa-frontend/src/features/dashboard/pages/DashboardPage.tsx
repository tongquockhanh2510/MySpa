import React, { useEffect, useMemo, useState } from 'react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import StatCard from '@components/common/StatCard';
import StatusChip from '@components/common/StatusChip';
import { getDashboardStats } from '@/api/dashboard';
import { getOrders } from '@/api/orders';
import { formatCurrency } from '@utils/formatters';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PeopleIcon from '@mui/icons-material/People';
import BadgeIcon from '@mui/icons-material/Badge';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';

const CHART_COLORS = ['#D97706', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];

const emptyStats = {
  todayRevenue: 0,
  monthRevenue: 0,
  yearRevenue: 0,
  revenueGrowthPercent: 0,
  todayAppointments: 0,
  monthAppointments: 0,
  totalCustomers: 0,
  newCustomersThisMonth: 0,
  customerGrowthPercent: 0,
  activeEmployees: 0,
  totalEmployees: 0,
  soldPackagesThisMonth: 0,
  lowStockProducts: 0,
  monthlyRevenue: [],
  popularServices: [],
  lowStockItems: [],
};

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '10px 14px', boxShadow: 'var(--shadow-lg)' }}>
      <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 6 }}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
          {entry.name === 'revenue' || entry.name === 'Doanh thu' ? formatCurrency(entry.value) : entry.value}
        </p>
      ))}
    </div>
  );
};

const SectionCard: React.FC<{ title: string; subtitle?: string; children: React.ReactNode; style?: React.CSSProperties }> = ({ title, subtitle, children, style }) => (
  <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)', padding: '20px 24px', ...style }}>
    <div style={{ marginBottom: 16 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{title}</h3>
      {subtitle && <p style={{ fontSize: 12.5, color: 'var(--text-tertiary)' }}>{subtitle}</p>}
    </div>
    {children}
  </div>
);

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>(emptyStats);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [statsData, ordersData] = await Promise.all([getDashboardStats(), getOrders()]);
        setStats({ ...emptyStats, ...statsData });
        setOrders(ordersData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  const monthlyRevenue = useMemo(() => {
    const byMonth = new Map((stats.monthlyRevenue || []).map((item: any) => [item.month, item]));
    return Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const item: any = byMonth.get(month);
      return {
        month: `T${month}`,
        revenue: Number(item?.revenue || 0),
        orderCount: Number(item?.orderCount || 0),
      };
    });
  }, [stats.monthlyRevenue]);

  const popularServices = (stats.popularServices || []).map((service: any) => ({
    name: service.serviceName,
    count: Number(service.bookingCount || 0),
    revenue: Number(service.totalRevenue || 0),
  }));

  const lowStockProducts = stats.lowStockItems || [];
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="animate-fadeIn">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px', marginBottom: 4 }}>
          Bảng điều khiển
        </h1>
        <p style={{ fontSize: 13.5, color: 'var(--text-tertiary)' }}>
          Dữ liệu thực từ hệ thống hôm nay - {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard title="Doanh thu hôm nay" value={Number(stats.todayRevenue || 0)} format="currency" icon={<AttachMoneyIcon />} color="#D97706" trend={Number(stats.revenueGrowthPercent || 0)} />
        <StatCard title="Lịch hẹn hôm nay" value={Number(stats.todayAppointments || 0)} icon={<CalendarMonthIcon />} color="#3B82F6" subtitle="buổi" />
        <StatCard title="Khách hàng mới" value={Number(stats.newCustomersThisMonth || 0)} icon={<PeopleIcon />} color="#10B981" trend={Number(stats.customerGrowthPercent || 0)} subtitle="trong tháng này" />
        <StatCard title="Nhân viên đang làm" value={Number(stats.activeEmployees || 0)} icon={<BadgeIcon />} color="#8B5CF6" subtitle={`/${Number(stats.totalEmployees || 0)} người`} />
        <StatCard title="Gói liệu trình đã bán" value={Number(stats.soldPackagesThisMonth || 0)} icon={<FolderSpecialIcon />} color="#F59E0B" subtitle="trong tháng này" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        <SectionCard title="Doanh thu 12 tháng" subtitle="Dữ liệu từ hóa đơn đã thanh toán">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyRevenue} margin={{ top: 5, right: 10, bottom: 0, left: 10 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D97706" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#D97706" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} formatter={() => 'Doanh thu'} />
              <Area type="monotone" dataKey="revenue" name="revenue" stroke="#D97706" strokeWidth={2.5} fill="url(#revenueGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Dịch vụ phổ biến" subtitle="Theo doanh thu tháng này">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={popularServices} cx="50%" cy="45%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="count" nameKey="name">
                {popularServices.map((_: any, index: number) => <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(value: any, name: any) => [`${value} lượt`, name]} contentStyle={{ borderRadius: 10, fontSize: 12, border: '1px solid var(--border-color)' }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          {!popularServices.length && <p style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center' }}>Chưa có dữ liệu dịch vụ</p>}
        </SectionCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <SectionCard title="Đơn hàng gần đây" subtitle={`${recentOrders.length} đơn hàng`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentOrders.map((order) => (
              <div key={order.orderId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--divider)' }}>
                <div>
                  <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{order.customerName}</p>
                  <p style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>{formatCurrency(order.totalAmount || 0)}</p>
                </div>
                <StatusChip status={order.orderStatus} type="order" />
              </div>
            ))}
            {!recentOrders.length && <p style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', padding: '16px 0' }}>{loading ? 'Đang tải...' : 'Chưa có đơn hàng'}</p>}
          </div>
        </SectionCard>

        <SectionCard title="Sản phẩm sắp hết hàng" subtitle={`${Number(stats.lowStockProducts || 0)} sản phẩm cần nhập`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {lowStockProducts.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', padding: '16px 0' }}>{loading ? 'Đang tải...' : 'Kho hàng đang ổn định'}</p>
            ) : (
              lowStockProducts.map((product: any) => (
                <div key={product.productId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--divider)' }}>
                  <div>
                    <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{product.productName}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{product.brand}</p>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: product.currentStock <= 3 ? '#EF4444' : '#F59E0B', background: product.currentStock <= 3 ? '#FEE2E2' : '#FEF3C7', padding: '2px 8px', borderRadius: 6 }}>
                    Còn {product.currentStock}
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
