import React, { useEffect, useMemo, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { Tabs, Tab, Box, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import PageHeader from '@components/common/PageHeader';
import ExportButtons from '@components/common/ExportButtons';
import { getDashboardStats } from '@/api/dashboard';
import { formatCurrency } from '@utils/formatters';
import { exportToExcel } from '@utils/exportExcel';
import { toast } from 'sonner';

const emptyStats = {
  yearRevenue: 0,
  monthlyRevenue: [],
  popularServices: [],
  topEmployees: [],
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

  const serviceRevenue = useMemo(() => (stats.popularServices || []).map((service: any) => ({
    name: service.serviceName,
    revenue: Number(service.totalRevenue || 0),
    count: Number(service.bookingCount || 0),
  })), [stats.popularServices]);

  const topEmployees = useMemo(() => (stats.topEmployees || []).map((employee: any) => ({
    name: employee.employeeName,
    revenue: Number(employee.totalRevenue || 0),
    commission: Number(employee.totalCommission || 0),
  })), [stats.topEmployees]);

  const totalRevenue = monthlyRevenue.reduce((sum, item) => sum + item.revenue, 0);
  const avgMonthly = totalRevenue / 12;
  const maxMonth = Math.max(0, ...monthlyRevenue.map(item => item.revenue));

  const handleExportExcel = () => {
    exportToExcel(
      monthlyRevenue.map(item => ({
        'Tháng': item.month,
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
    <div className="animate-fadeIn">
      <PageHeader title="Báo cáo doanh thu" subtitle={loading ? 'Đang tải dữ liệu thật...' : `Năm ${year}`}
        extra={
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 100, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}>
              <InputLabel>Năm</InputLabel>
              <Select value={year} onChange={e => setYear(Number(e.target.value))} label="Năm">
                {yearOptions.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
              </Select>
            </FormControl>
            <ExportButtons onExportExcel={handleExportExcel} onExportPdf={() => { window.print(); toast.success('Xuất PDF thành công'); }} />
          </div>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Tổng doanh thu năm', value: totalRevenue || Number(stats.yearRevenue || 0), color: 'var(--primary)' },
          { label: 'Doanh thu trung bình/tháng', value: avgMonthly, color: '#3B82F6' },
          { label: 'Tháng cao nhất', value: maxMonth, color: '#10B981' },
        ].map(item => (
          <div key={item.label} style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', padding: '16px 20px', boxShadow: 'var(--shadow-card)' }}>
            <p style={{ fontSize: 12.5, color: 'var(--text-tertiary)', marginBottom: 4 }}>{item.label}</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: item.color }}>{formatCurrency(item.value)}</p>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)', overflow: 'hidden', marginBottom: 16 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: '1px solid var(--border-color)', px: 2, '& .MuiTab-root': { textTransform: 'none', fontFamily: 'inherit', fontWeight: 500, fontSize: 14 }, '& .Mui-selected': { color: 'var(--primary) !important', fontWeight: 600 }, '& .MuiTabs-indicator': { background: 'var(--primary)' } }}>
          <Tab label="Doanh thu theo tháng" />
          <Tab label="Top dịch vụ" />
          <Tab label="Top nhân viên" />
        </Tabs>
        <Box sx={{ p: 3 }}>
          {tab === 0 && (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthlyRevenue}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D97706" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#D97706" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000000).toFixed(0)}M`} />
                <Tooltip formatter={(v: any) => [formatCurrency(v), 'Doanh thu']} labelStyle={{ color: 'var(--text-primary)' }} contentStyle={{ borderRadius: 10, border: '1px solid var(--border-color)' }} />
                <Legend formatter={() => 'Doanh thu'} />
                <Area type="monotone" dataKey="revenue" name="revenue" stroke="#D97706" strokeWidth={2.5} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
          {tab === 1 && (
            serviceRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={serviceRevenue} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000000).toFixed(0)}M`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} width={140} />
                  <Tooltip formatter={(v: any) => [formatCurrency(v), 'Doanh thu']} contentStyle={{ borderRadius: 10, border: '1px solid var(--border-color)' }} />
                  <Bar dataKey="revenue" fill="#D97706" radius={[0, 6, 6, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', padding: 32 }}>Chưa có dữ liệu dịch vụ trong năm/tháng này</p>
          )}
          {tab === 2 && (
            topEmployees.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={topEmployees}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000000).toFixed(0)}M`} />
                  <Tooltip formatter={(v: any, name: any) => [formatCurrency(v), name === 'revenue' ? 'Doanh thu' : 'Hoa hồng']} contentStyle={{ borderRadius: 10, border: '1px solid var(--border-color)' }} />
                  <Legend formatter={v => v === 'revenue' ? 'Doanh thu' : 'Hoa hồng'} />
                  <Bar dataKey="revenue" name="revenue" fill="#D97706" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="commission" name="commission" fill="#F59E0B" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', padding: 32 }}>Chưa có dữ liệu doanh thu nhân viên từ backend</p>
          )}
        </Box>
      </div>
    </div>
  );
};

export default ReportsPage;
