import React, { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Box, FormControl, InputLabel, MenuItem, Select, Tab, Tabs } from '@mui/material';
import PageHeader from '@components/common/PageHeader';
import ExportButtons from '@components/common/ExportButtons';
import { getDashboardStats } from '@/api/dashboard';
import { formatCurrency } from '@utils/formatters';
import { exportToExcel } from '@utils/exportExcel';
import { toast } from 'sonner';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import './ReportsPage.css';

const emptyStats = {
  yearRevenue: 0,
  monthlyRevenue: [],
  popularServices: [],
  topEmployees: [],
};

const inputSx = {
  minWidth: 110,
  '& .MuiOutlinedInput-root': { borderRadius: '10px' },
};

const ReportsPage: React.FC = () => {
  const [tab, setTab] = useState(0);
  const [year, setYear] = useState(new Date().getFullYear());
  const [stats, setStats] = useState<any>(emptyStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReport = async () => {
      try {
        setLoading(true);
        const data = await getDashboardStats(year);
        setStats({ ...emptyStats, ...data });
      } catch (err) {
        console.error(err);
        toast.error('Không thể tải báo cáo doanh thu');
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [year]);

  const monthlyRevenue = useMemo(() => {
    const byMonth = new Map((stats.monthlyRevenue || []).map((item: any) => [item.month, item]));

    return Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const item: any = byMonth.get(month);

      return {
        month: `T${month}`,
        monthNumber: month,
        revenue: Number(item?.revenue || 0),
        orderCount: Number(item?.orderCount || 0),
      };
    });
  }, [stats.monthlyRevenue]);

  const serviceRevenue = useMemo(
    () =>
      (stats.popularServices || []).map((service: any) => ({
        name: service.serviceName,
        revenue: Number(service.totalRevenue || 0),
        count: Number(service.bookingCount || 0),
      })),
    [stats.popularServices]
  );

  const topEmployees = useMemo(
    () =>
      (stats.topEmployees || []).map((employee: any) => ({
        name: employee.employeeName,
        revenue: Number(employee.totalRevenue || 0),
        commission: Number(employee.totalCommission || 0),
      })),
    [stats.topEmployees]
  );

  const totalRevenue = monthlyRevenue.reduce((sum, item) => sum + item.revenue, 0);
  const totalOrders = monthlyRevenue.reduce((sum, item) => sum + item.orderCount, 0);
  const avgMonthly = totalRevenue / 12;
  const bestMonth = monthlyRevenue.reduce(
    (best, item) => (item.revenue > best.revenue ? item : best),
    monthlyRevenue[0] || { month: 'T1', revenue: 0, orderCount: 0 }
  );
  const reportedRevenue = totalRevenue || Number(stats.yearRevenue || 0);

  const handleExportExcel = () => {
    exportToExcel(
      monthlyRevenue.map((item) => ({
        Tháng: item.month,
        'Doanh thu': item.revenue,
        'Số hóa đơn': item.orderCount,
      })),
      `Bao_cao_doanh_thu_${year}`,
      'Doanh thu'
    );
    toast.success('Xuất Excel thành công');
  };

  const yearOptions = Array.from({ length: 5 }, (_, index) => new Date().getFullYear() - 3 + index);

  return (
    <main className="reports-page animate-fadeIn">
      <PageHeader
        title="Báo cáo doanh thu"
        subtitle={loading ? 'Đang tải dữ liệu...' : `Tổng hợp hiệu suất kinh doanh năm ${year}`}
        extra={
          <div className="reports-page__header-actions">
            <FormControl size="small" sx={inputSx}>
              <InputLabel>Năm</InputLabel>
              <Select value={year} onChange={(event) => setYear(Number(event.target.value))} label="Năm">
                {yearOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <ExportButtons
              onExportExcel={handleExportExcel}
              onExportPdf={() => {
                window.print();
                toast.success('Xuất PDF thành công');
              }}
            />
          </div>
        }
      />

      <section className="reports-page__summary" aria-label="Tổng quan báo cáo">
        <article className="reports-page__summary-card">
          <AssessmentIcon />
          <div>
            <span>Tổng doanh thu</span>
            <strong>{formatCurrency(reportedRevenue)}</strong>
          </div>
        </article>
        <article className="reports-page__summary-card">
          <TrendingUpIcon />
          <div>
            <span>Trung bình/tháng</span>
            <strong>{formatCurrency(avgMonthly)}</strong>
          </div>
        </article>
        <article className="reports-page__summary-card">
          <WorkspacePremiumIcon />
          <div>
            <span>Tháng cao nhất</span>
            <strong>{bestMonth.month}</strong>
            <small>{formatCurrency(bestMonth.revenue)}</small>
          </div>
        </article>
        <article className="reports-page__summary-card">
          <ReceiptLongIcon />
          <div>
            <span>Số hóa đơn</span>
            <strong>{totalOrders}</strong>
          </div>
        </article>
      </section>

      <div className="reports-page__panel">
        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          className="reports-page__tabs"
          sx={{
            '& .MuiTab-root': { textTransform: 'none', fontFamily: 'inherit', fontWeight: 500, fontSize: 14 },
            '& .Mui-selected': { color: 'var(--primary) !important', fontWeight: 600 },
            '& .MuiTabs-indicator': { background: 'var(--primary)' },
          }}
        >
          <Tab label="Doanh thu theo tháng" />
          <Tab label="Top dịch vụ" />
          <Tab label="Top nhân viên" />
        </Tabs>
        <Box className="reports-page__chart-body">
          {tab === 0 && (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyRevenue}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D97706" stopOpacity={0.26} />
                    <stop offset="100%" stopColor="#D97706" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                />
                <Tooltip
                  formatter={(value: any) => [formatCurrency(value), 'Doanh thu']}
                  labelStyle={{ color: 'var(--text-primary)' }}
                  contentStyle={{ borderRadius: 10, border: '1px solid var(--border-color)' }}
                />
                <Legend formatter={() => 'Doanh thu'} />
                <Area type="monotone" dataKey="revenue" name="revenue" stroke="#D97706" strokeWidth={2.5} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
          {tab === 1 &&
            (serviceRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={serviceRevenue} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                  />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} width={150} />
                  <Tooltip formatter={(value: any) => [formatCurrency(value), 'Doanh thu']} contentStyle={{ borderRadius: 10, border: '1px solid var(--border-color)' }} />
                  <Bar dataKey="revenue" fill="#D97706" radius={[0, 6, 6, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="reports-page__empty">Chưa có dữ liệu dịch vụ trong năm này</p>
            ))}
          {tab === 2 &&
            (topEmployees.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topEmployees}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                  />
                  <Tooltip
                    formatter={(value: any, name: any) => [formatCurrency(value), name === 'revenue' ? 'Doanh thu' : 'Hoa hồng']}
                    contentStyle={{ borderRadius: 10, border: '1px solid var(--border-color)' }}
                  />
                  <Legend formatter={(value) => (value === 'revenue' ? 'Doanh thu' : 'Hoa hồng')} />
                  <Bar dataKey="revenue" name="revenue" fill="#D97706" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="commission" name="commission" fill="#F59E0B" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="reports-page__empty">Chưa có dữ liệu doanh thu nhân viên từ backend</p>
            ))}
        </Box>
      </div>
    </main>
  );
};

export default ReportsPage;
