import { useEffect, useMemo, useState } from 'react';
import { getDashboardStats } from '@/api/dashboard';
import { getOrders } from '@/api/orders';

export const emptyStats = {
  todayRevenue: 0,
  monthRevenue: 0,
  yearRevenue: 0,
  revenueGrowthPercent: null as number | null,
  todayRevenueGrowthPercent: null as number | null,
  todayAppointments: 0,
  monthAppointments: 0,
  totalCustomers: 0,
  newCustomersThisMonth: 0,
  customerGrowthPercent: null as number | null,
  activeEmployees: 0,
  totalEmployees: 0,
  soldPackagesThisMonth: 0,
  lowStockProducts: 0,
  monthlyRevenue: [],
  popularServices: [],
  lowStockItems: [],
};

export type DashboardStats = typeof emptyStats & Record<string, any>;

// Du lieu + tinh toan dung chung cho ban desktop va mobile cua Dashboard,
// tranh trung lap logic goi API giua 2 file giao dien.
export const useDashboardData = () => {
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    if (!isRefresh) setLoading(true);
    setError(null);

    try {
      const [statsData, ordersData] = await Promise.all([getDashboardStats(), getOrders()]);
      setStats({ ...emptyStats, ...statsData });
      setOrders(Array.isArray(ordersData) ? ordersData : []);
    } catch (err) {
      console.error(err);
      setStats(emptyStats);
      setOrders([]);
      setError('Không thể tải dữ liệu dashboard. Vui lòng kiểm tra đăng nhập hoặc quyền truy cập.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const monthlyRevenue = useMemo(() => {
    const byMonth = new Map((stats.monthlyRevenue || []).map((item: any) => [Number(item.month), item]));
    return Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const item: any = byMonth.get(month);
      return {
        month: `T${month}`,
        revenue: Number(item?.revenue || 0),
        profit: Number(item?.profit ?? item?.revenue ?? 0),
        orderCount: Number(item?.orderCount || 0),
      };
    });
  }, [stats.monthlyRevenue]);

  const popularServices = useMemo(() => (
    (stats.popularServices || []).slice(0, 5).map((service: any) => ({
      name: service.serviceName || service.name || 'Dịch vụ',
      count: Number(service.bookingCount || service.count || 0),
      revenue: Number(service.totalRevenue || service.revenue || 0),
    }))
  ), [stats.popularServices]);

  const lowStockProducts = (stats.lowStockItems || []).slice(0, 6);
  const recentOrders = orders.slice(0, 6);
  const totalPopularBookings = popularServices.reduce((sum, service) => sum + service.count, 0);
  const currentMonthRevenue = monthlyRevenue[new Date().getMonth()]?.revenue || 0;
  const previousMonthRevenue = monthlyRevenue[Math.max(new Date().getMonth() - 1, 0)]?.revenue || 0;
  const revenueDelta = currentMonthRevenue - previousMonthRevenue;

  return {
    stats,
    loading,
    refreshing,
    error,
    loadDashboard,
    monthlyRevenue,
    popularServices,
    lowStockProducts,
    recentOrders,
    totalPopularBookings,
    revenueDelta,
  };
};

export default useDashboardData;
