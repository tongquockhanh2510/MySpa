import React, { useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { Tabs, Tab, Box, Chip, IconButton } from '@mui/material';
import PageHeader from '@components/common/PageHeader';
import { mockAmountPromotions, mockPercentPromotions } from '@utils/mockData';
import { formatCurrency, formatDateTime } from '@utils/formatters';
import type { AmountPromotion, PercentPromotion } from '@/types';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

const PromotionsPage: React.FC = () => {
  const [tab, setTab] = useState(0);

  const statusCell = ({ value }: any) => (
    <Chip
      icon={value ? <CheckCircleIcon sx={{ fontSize: 14, color: '#059669 !important' }} /> : <CancelIcon sx={{ fontSize: 14, color: '#DC2626 !important' }} />}
      label={value ? 'Đang áp dụng' : 'Đã tắt'}
      size="small"
      sx={{ background: value ? '#D1FAE5' : '#FEE2E2', color: value ? '#059669' : '#DC2626', fontWeight: 600, fontSize: 11, borderRadius: 1 }}
    />
  );

  const baseColumns: GridColDef[] = [
    { field: 'name', headerName: 'Tên khuyến mãi', flex: 1, minWidth: 200 },
    { field: 'code', headerName: 'Mã code', width: 140, renderCell: ({ value }) => <code style={{ background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{value}</code> },
    { field: 'minOrderValue', headerName: 'Đơn tối thiểu', width: 140, renderCell: ({ value }) => formatCurrency(value) },
    { field: 'effective', headerName: 'Bắt đầu', width: 150, renderCell: ({ value }) => formatDateTime(value) },
    { field: 'expiration', headerName: 'Kết thúc', width: 150, renderCell: ({ value }) => formatDateTime(value) },
    { field: 'quantity', headerName: 'Số lượng', width: 100, align: 'center', headerAlign: 'center' },
    { field: 'isActive', headerName: 'Trạng thái', width: 140, renderCell: statusCell },
  ];

  const amountColumns: GridColDef[] = [
    ...baseColumns.slice(0, 1),
    { field: 'discount', headerName: 'Giảm (VNĐ)', width: 130, renderCell: ({ value }) => <span style={{ fontWeight: 700, color: '#EF4444' }}>-{formatCurrency(value)}</span> },
    ...baseColumns.slice(1),
  ];

  const percentColumns: GridColDef[] = [
    ...baseColumns.slice(0, 1),
    { field: 'percent', headerName: 'Giảm (%)', width: 100, renderCell: ({ value }) => <span style={{ fontWeight: 700, color: '#EF4444' }}>-{value}%</span> },
    { field: 'maxDiscount', headerName: 'Giảm tối đa', width: 130, renderCell: ({ value }) => formatCurrency(value) },
    ...baseColumns.slice(1),
  ];

  const gridSx = { border: 'none', '& .MuiDataGrid-columnHeaders': { background: 'var(--bg-tertiary)' } };
  const gridLocale = { MuiTablePagination: { labelRowsPerPage: 'Hàng mỗi trang:', labelDisplayedRows: ({ from, to, count }: { from: number; to: number; count: number }) => `${from}–${to} / ${count}` }, noRowsLabel: 'Không có dữ liệu' };

  return (
    <div className="animate-fadeIn">
      <PageHeader title="Quản lý khuyến mãi" subtitle="Giảm theo số tiền và phần trăm" />
      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: '1px solid var(--border-color)', px: 2, '& .MuiTab-root': { textTransform: 'none', fontFamily: 'inherit', fontWeight: 500, fontSize: 14 }, '& .Mui-selected': { color: 'var(--primary) !important', fontWeight: 600 }, '& .MuiTabs-indicator': { background: 'var(--primary)' } }}>
          <Tab label={`Giảm tiền trực tiếp (${mockAmountPromotions.length})`} />
          <Tab label={`Giảm theo phần trăm (${mockPercentPromotions.length})`} />
        </Tabs>
        <Box>
          {tab === 0 && <DataGrid rows={mockAmountPromotions} columns={amountColumns} getRowId={r => r.promotionId} initialState={{ pagination: { paginationModel: { pageSize: 10 } } }} pageSizeOptions={[10, 20]} autoHeight disableRowSelectionOnClick sx={gridSx} localeText={gridLocale} />}
          {tab === 1 && <DataGrid rows={mockPercentPromotions} columns={percentColumns} getRowId={r => r.promotionId} initialState={{ pagination: { paginationModel: { pageSize: 10 } } }} pageSizeOptions={[10, 20]} autoHeight disableRowSelectionOnClick sx={gridSx} localeText={gridLocale} />}
        </Box>
      </div>
    </div>
  );
};

export default PromotionsPage;
