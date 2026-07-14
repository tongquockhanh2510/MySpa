import React, { useEffect, useMemo, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  TextField,
} from '@mui/material';
import PageHeader from '@components/common/PageHeader';
import ExportButtons from '@components/common/ExportButtons';
import { formatCurrency, formatMonth } from '@utils/formatters';
import { exportToExcel } from '@utils/exportExcel';
import { useAppSelector } from '@hooks/useAppSelector';
import { hasAnyRole } from '@utils/authorization';
import { toast } from 'sonner';
import {
  getSalarySummary,
  getMySalarySummary,
  getCommissionDetails,
  getMyCommissionDetails,
  backfillCommissions,
  updatePayroll,
  type EmployeeSalary,
  type CommissionDetail,
} from '@/api/salaries';

const inputSx = { '& .MuiOutlinedInput-root': { borderRadius: '10px' } };

const commissionTypeLabels: Record<string, string> = {
  SERVICE: 'Dịch vụ',
  PRODUCT: 'Sản phẩm',
  PACKAGE: 'Gói liệu trình',
  REFERRAL: 'Giới thiệu',
};

const commissionTypeColors: Record<string, 'primary' | 'secondary' | 'success' | 'info'> = {
  SERVICE: 'primary',
  PRODUCT: 'info',
  PACKAGE: 'secondary',
  REFERRAL: 'success',
};

const now = new Date();

const SalariesPage: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user);
  const canViewCompanyPayroll = hasAnyRole(user, ['ADMIN', 'MANAGER']);
  const [salaries, setSalaries] = useState<EmployeeSalary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);
  const [filterYear, setFilterYear] = useState(now.getFullYear());

  const [commissionTarget, setCommissionTarget] = useState<EmployeeSalary | null>(null);
  const [commissionRows, setCommissionRows] = useState<CommissionDetail[]>([]);
  const [commissionLoading, setCommissionLoading] = useState(false);
  const [backfilling, setBackfilling] = useState(false);
  const [payrollTarget, setPayrollTarget] = useState<EmployeeSalary | null>(null);
  const [payrollForm, setPayrollForm] = useState({ bonus: 0, penalty: 0, salaryAdvance: 0, status: 'DRAFT' as 'DRAFT' | 'LOCKED' | 'PAID' });
  const [payrollSaving, setPayrollSaving] = useState(false);

  const loadSalaries = async () => {
    setLoading(true);
    try {
      const data = canViewCompanyPayroll
        ? await getSalarySummary(filterMonth, filterYear)
        : await getMySalarySummary(filterMonth, filterYear);
      setSalaries(data);
    } catch (error) {
      console.error(error);
      toast.error('Không tải được bảng lương & hoa hồng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSalaries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterMonth, filterYear, canViewCompanyPayroll]);

  const openCommissionDetail = async (row: EmployeeSalary) => {
    setCommissionTarget(row);
    setCommissionLoading(true);
    try {
      const data = canViewCompanyPayroll
        ? await getCommissionDetails(row.employeeId, filterMonth, filterYear)
        : await getMyCommissionDetails(filterMonth, filterYear);
      setCommissionRows(data);
    } catch (error) {
      console.error(error);
      toast.error('Không tải được chi tiết hoa hồng');
      setCommissionRows([]);
    } finally {
      setCommissionLoading(false);
    }
  };

  const handleBackfill = async () => {
    setBackfilling(true);
    try {
      const created = await backfillCommissions();
      if (created > 0) {
        toast.success(`Đã sinh bù ${created} bản ghi hoa hồng từ dữ liệu cũ. Kiểm tra đúng tháng phát sinh.`);
      } else {
        toast.info('Không có hoa hồng mới cần sinh bù (đã đầy đủ hoặc chưa có giao dịch hợp lệ).');
      }
      await loadSalaries();
    } catch (error) {
      console.error(error);
      toast.error('Sinh bù hoa hồng không thành công');
    } finally {
      setBackfilling(false);
    }
  };

  const totals = useMemo(() => ({
    payout: salaries.reduce((sum, s) => sum + s.totalSalary, 0),
    commission: salaries.reduce((sum, s) => sum + s.totalCommission, 0),
    base: salaries.reduce((sum, s) => sum + s.baseSalary, 0),
  }), [salaries]);

  const commissionTotal = commissionRows.reduce((sum, item) => sum + item.commissionAmount, 0);

  const columns: GridColDef[] = [
    { field: 'employeeName', headerName: 'Nhân viên', flex: 1, minWidth: 180 },
    { field: 'position', headerName: 'Vị trí', width: 150, renderCell: ({ value }) => value || '—' },
    { field: 'baseSalary', headerName: 'Lương cơ bản', width: 150, renderCell: ({ value }) => formatCurrency(value ?? 0) },
    { field: 'bonus', headerName: 'Thưởng', width: 115, renderCell: ({ value }) => formatCurrency(value || 0) },
    { field: 'penalty', headerName: 'Phạt', width: 115, renderCell: ({ value }) => formatCurrency(value || 0) },
    { field: 'salaryAdvance', headerName: 'Đã ứng', width: 115, renderCell: ({ value }) => formatCurrency(value || 0) },
    {
      field: 'totalCommission',
      headerName: 'Hoa hồng',
      width: 170,
      renderCell: ({ row, value }) => (
        <Button
          size="small"
          onClick={() => openCommissionDetail(row)}
          disabled={!value}
          sx={{ textTransform: 'none', color: value ? '#059669' : 'var(--text-tertiary)', fontWeight: 800, px: 0 }}
        >
          {formatCurrency(value || 0)}
          {row.commissionCount > 0 && (
            <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 6, color: 'var(--text-tertiary)' }}>
              ({row.commissionCount})
            </span>
          )}
        </Button>
      ),
    },
    {
      field: 'totalSalary',
      headerName: 'Tổng thực lĩnh',
      width: 170,
      renderCell: ({ value }) => <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 14 }}>{formatCurrency(value)}</span>,
    },
    {
      field: 'payrollStatus', headerName: 'Kỳ lương', width: 130,
      renderCell: ({ row, value }) => <Button size="small" disabled={!canViewCompanyPayroll || value === 'PAID'} onClick={() => { setPayrollTarget(row); setPayrollForm({ bonus: row.bonus || 0, penalty: row.penalty || 0, salaryAdvance: row.salaryAdvance || 0, status: row.payrollStatus || 'DRAFT' }); }} sx={{ textTransform: 'none' }}>{value === 'PAID' ? 'Đã chi' : value === 'LOCKED' ? 'Đã chốt' : 'Nháp'}</Button>,
    },
  ];

  const savePayroll = async () => {
    if (!payrollTarget) return;
    setPayrollSaving(true);
    try {
      const saved = await updatePayroll(payrollTarget.employeeId, filterMonth, filterYear, payrollForm);
      setSalaries(rows => rows.map(row => row.employeeId === saved.employeeId ? saved : row));
      setPayrollTarget(null);
      toast.success('Đã cập nhật kỳ lương');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể cập nhật kỳ lương');
    } finally {
      setPayrollSaving(false);
    }
  };

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Lương & hoa hồng nhân viên"
        subtitle={`${formatMonth(filterMonth, filterYear)} · Tổng chi: ${formatCurrency(totals.payout)}`}
        extra={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {canViewCompanyPayroll && (
          <Button
            variant="outlined"
            size="small"
            onClick={handleBackfill}
            disabled={backfilling}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, whiteSpace: 'nowrap' }}
          >
            {backfilling ? 'Đang sinh bù...' : 'Sinh bù hoa hồng'}
          </Button>
          )}
          <ExportButtons onExportExcel={() => {
            exportToExcel(
              salaries.map(s => ({
                'Nhân viên': s.employeeName,
                'Vị trí': s.position || '',
                'Tháng': `${s.month}/${s.year}`,
                'Lương cơ bản': s.baseSalary,
                'Hoa hồng': s.totalCommission,
                'Số lần hoa hồng': s.commissionCount,
                'Tổng thực lĩnh': s.totalSalary,
              })),
              'Bang_luong',
              'Lương',
            );
            toast.success('Xuất Excel thành công');
          }} />
          </div>
        }
      />

      <div style={{ marginBottom: 16, background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', padding: '16px 20px', boxShadow: 'var(--shadow-card)', display: 'flex', gap: 16 }}>
        <FormControl size="small" sx={{ minWidth: 120, ...inputSx }}>
          <InputLabel>Tháng</InputLabel>
          <Select value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))} label="Tháng">
            {Array.from({ length: 12 }, (_, i) => <MenuItem key={i + 1} value={i + 1}>Tháng {i + 1}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 100, ...inputSx }}>
          <InputLabel>Năm</InputLabel>
          <Select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))} label="Năm">
            {[now.getFullYear() - 2, now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </Select>
        </FormControl>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Tổng thực lĩnh', value: totals.payout, color: 'var(--primary)' },
          { label: 'Tổng hoa hồng', value: totals.commission, color: '#059669' },
          { label: 'Tổng lương cơ bản', value: totals.base, color: '#3B82F6' },
        ].map((item) => (
          <div key={item.label} style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', padding: '16px 20px', boxShadow: 'var(--shadow-card)' }}>
            <p style={{ fontSize: 12.5, color: 'var(--text-tertiary)', marginBottom: 6 }}>{item.label}</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: item.color }}>{loading ? '...' : formatCurrency(item.value)}</p>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 16, display: 'grid', gap: 8 }}>
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} variant="rounded" height={44} />)}
          </div>
        ) : (
          <DataGrid
            rows={salaries}
            columns={columns}
            getRowId={r => r.employeeId}
            autoHeight
            disableRowSelectionOnClick
            sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { background: 'var(--bg-tertiary)' } }}
            localeText={{ MuiTablePagination: { labelRowsPerPage: 'Hàng mỗi trang:', labelDisplayedRows: ({ from, to, count }: any) => `${from}-${to} / ${count}` }, noRowsLabel: 'Chưa có dữ liệu lương trong kỳ này' } as any}
          />
        )}
      </div>

      <Dialog open={!!payrollTarget} onClose={() => !payrollSaving && setPayrollTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Điều chỉnh kỳ lương · {payrollTarget?.employeeName}</DialogTitle>
        <DialogContent sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, pt: '12px !important' }}>
          <TextField label="Thưởng" type="number" value={payrollForm.bonus} onChange={e => setPayrollForm(form => ({ ...form, bonus: Number(e.target.value) }))} />
          <TextField label="Phạt" type="number" value={payrollForm.penalty} onChange={e => setPayrollForm(form => ({ ...form, penalty: Number(e.target.value) }))} />
          <TextField label="Đã ứng lương" type="number" value={payrollForm.salaryAdvance} onChange={e => setPayrollForm(form => ({ ...form, salaryAdvance: Number(e.target.value) }))} />
          <FormControl><InputLabel>Trạng thái</InputLabel><Select value={payrollForm.status} label="Trạng thái" onChange={e => setPayrollForm(form => ({ ...form, status: e.target.value as any }))}><MenuItem value="DRAFT">Nháp</MenuItem><MenuItem value="LOCKED">Đã chốt</MenuItem><MenuItem value="PAID" disabled={payrollForm.status === 'DRAFT'}>Đã chi</MenuItem></Select></FormControl>
        </DialogContent>
        <DialogActions><Button onClick={() => setPayrollTarget(null)}>Hủy</Button><Button variant="contained" disabled={payrollSaving} onClick={savePayroll}>{payrollSaving ? 'Đang lưu...' : 'Lưu kỳ lương'}</Button></DialogActions>
      </Dialog>

      <Dialog open={!!commissionTarget} onClose={() => setCommissionTarget(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          Chi tiết hoa hồng · {commissionTarget?.employeeName} · {formatMonth(filterMonth, filterYear)}
        </DialogTitle>
        <DialogContent>
          <div style={{ display: 'grid', gap: 10 }}>
            {commissionLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="rounded" height={56} />)
            ) : commissionRows.map((item) => (
              <div key={item.commissionId} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 70px 140px', gap: 12, alignItems: 'center', borderBottom: '1px solid var(--border-color)', padding: '10px 0' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Chip label={commissionTypeLabels[item.commissionType] || item.commissionType} size="small" color={commissionTypeColors[item.commissionType] || 'primary'} sx={{ fontWeight: 700, fontSize: 11, height: 20 }} />
                    <strong>{item.description}</strong>
                  </div>
                  <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 12.5 }}>
                    Mã tham chiếu: {item.referenceId} · {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <span>{formatCurrency(item.baseAmount)}</span>
                <span>{item.commissionRate}%</span>
                <strong style={{ color: '#059669' }}>{formatCurrency(item.commissionAmount)}</strong>
              </div>
            ))}
            {!commissionLoading && commissionRows.length === 0 && (
              <p style={{ color: 'var(--text-secondary)' }}>Chưa có hoa hồng nào trong kỳ này cho nhân viên.</p>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, fontWeight: 800 }}>
              <span>Tổng hoa hồng</span>
              <span style={{ color: '#059669' }}>{formatCurrency(commissionTotal)}</span>
            </div>
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setCommissionTarget(null)} sx={{ textTransform: 'none' }}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default SalariesPage;
