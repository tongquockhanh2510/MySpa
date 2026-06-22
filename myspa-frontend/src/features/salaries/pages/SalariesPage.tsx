import React, { useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import PageHeader from '@components/common/PageHeader';
import ExportButtons from '@components/common/ExportButtons';
import { mockSalaries } from '@utils/mockData';
import { formatCurrency, formatMonth } from '@utils/formatters';
import { exportToExcel } from '@utils/exportExcel';
import { toast } from 'sonner';
import type { Salary } from '@/types';

const SalariesPage: React.FC = () => {
  const [salaries] = useState<Salary[]>(mockSalaries);
  const [filterMonth, setFilterMonth] = useState(5);
  const [filterYear, setFilterYear] = useState(2024);

  const filtered = salaries.filter(s => s.month === filterMonth && s.year === filterYear);
  const totalSalary = filtered.reduce((sum, s) => sum + s.totalSalary, 0);

  const columns: GridColDef[] = [
    { field: 'employeeName', headerName: 'Nhân viên', flex: 1, minWidth: 180 },
    { field: 'totalWorkingHours', headerName: 'Giờ làm', width: 100, align: 'center', headerAlign: 'center', renderCell: ({ value }) => `${value}h` },
    { field: 'baseSalary', headerName: 'Lương cơ bản', width: 140, renderCell: ({ value }) => formatCurrency(value ?? 0) },
    { field: 'totalCommission', headerName: 'Hoa hồng', width: 130, renderCell: ({ value }) => <span style={{ color: '#059669', fontWeight: 600 }}>{formatCurrency(value)}</span> },
    { field: 'bonus', headerName: 'Thưởng', width: 120, renderCell: ({ value }) => <span style={{ color: '#3B82F6', fontWeight: 600 }}>{formatCurrency(value)}</span> },
    { field: 'penalty', headerName: 'Phạt', width: 110, renderCell: ({ value }) => <span style={{ color: '#EF4444', fontWeight: 600 }}>{formatCurrency(value)}</span> },
    { field: 'totalSalary', headerName: 'Thực lĩnh', width: 150, renderCell: ({ value }) => <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 14 }}>{formatCurrency(value)}</span> },
  ];

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Lương nhân viên"
        subtitle={`${formatMonth(filterMonth, filterYear)} · Tổng: ${formatCurrency(totalSalary)}`}
        extra={
          <ExportButtons onExportExcel={() => {
            exportToExcel(filtered.map(s => ({ 'Nhân viên': s.employeeName, 'Tháng': `${s.month}/${s.year}`, 'Giờ làm': s.totalWorkingHours, 'Hoa hồng': s.totalCommission, 'Thưởng': s.bonus, 'Phạt': s.penalty, 'Thực lĩnh': s.totalSalary })), 'Bang_luong', 'Lương');
            toast.success('Xuất Excel thành công');
          }} />
        }
      />

      {/* Filter */}
      <div style={{ marginBottom: 16, background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', padding: '16px 20px', boxShadow: 'var(--shadow-card)', display: 'flex', gap: 16 }}>
        <FormControl size="small" sx={{ minWidth: 120, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}>
          <InputLabel>Tháng</InputLabel>
          <Select value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))} label="Tháng">
            {Array.from({ length: 12 }, (_, i) => <MenuItem key={i + 1} value={i + 1}>Tháng {i + 1}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 100, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}>
          <InputLabel>Năm</InputLabel>
          <Select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))} label="Năm">
            {[2023, 2024, 2025].map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </Select>
        </FormControl>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Tổng thực lĩnh', value: totalSalary, color: 'var(--primary)' },
          { label: 'Tổng hoa hồng', value: filtered.reduce((s, e) => s + e.totalCommission, 0), color: '#059669' },
          { label: 'Tổng thưởng', value: filtered.reduce((s, e) => s + e.bonus, 0), color: '#3B82F6' },
        ].map((item) => (
          <div key={item.label} style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', padding: '16px 20px', boxShadow: 'var(--shadow-card)' }}>
            <p style={{ fontSize: 12.5, color: 'var(--text-tertiary)', marginBottom: 6 }}>{item.label}</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: item.color }}>{formatCurrency(item.value)}</p>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
        <DataGrid rows={filtered} columns={columns} getRowId={r => r.salaryId} autoHeight disableRowSelectionOnClick
          sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { background: 'var(--bg-tertiary)' } }}
          localeText={{ MuiTablePagination: { labelRowsPerPage: 'Hàng mỗi trang:', labelDisplayedRows: ({ from, to, count }: any) => `${from}–${to} / ${count}` }, noRowsLabel: 'Không có dữ liệu lương' } as any} />
      </div>
    </div>
  );
};

export default SalariesPage;
