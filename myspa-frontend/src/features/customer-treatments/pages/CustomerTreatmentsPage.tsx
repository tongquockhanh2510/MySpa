import React, { useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { LinearProgress, Chip } from '@mui/material';
import PageHeader from '@components/common/PageHeader';
import { mockCustomerTreatments } from '@utils/mockData';
import { formatDate } from '@utils/formatters';
import type { CustomerTreatment } from '@/types';

const CustomerTreatmentsPage: React.FC = () => {
  const [treatments] = useState<CustomerTreatment[]>(mockCustomerTreatments);

  const columns: GridColDef[] = [
    { field: 'customerId', headerName: 'Mã KH', width: 100 },
    { field: 'customerName', headerName: 'Khách hàng', flex: 1, minWidth: 160 },
    { field: 'packageName', headerName: 'Tên gói liệu trình', flex: 1, minWidth: 200 },
    {
      field: 'remainingSessions', headerName: 'Tiến độ buổi', width: 200,
      renderCell: ({ row }) => {
        const total = mockCustomerTreatments.find(t => t.customerId === row.customerId)?.remainingSessions ?? 0;
        const used = 10 - row.remainingSessions;
        const pct = Math.max(0, Math.min(100, (used / 10) * 100));
        return (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
              <span style={{ color: 'var(--text-tertiary)' }}>Còn lại: {row.remainingSessions} buổi</span>
            </div>
            <LinearProgress variant="determinate" value={pct} sx={{ borderRadius: 4, height: 6, background: 'var(--bg-tertiary)', '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #D97706, #F59E0B)', borderRadius: 4 } }} />
          </div>
        );
      },
    },
    { field: 'purchaseDate', headerName: 'Ngày mua', width: 120, renderCell: ({ value }) => formatDate(value) },
    { field: 'expiryDate', headerName: 'Hết hạn', width: 120, renderCell: ({ value }) => formatDate(value) },
    {
      field: 'status', headerName: 'Trạng thái', width: 130,
      renderCell: ({ row }) => {
        const expired = new Date(row.expiryDate) < new Date();
        const label = row.cancelDate ? 'Đã hủy' : expired ? 'Hết hạn' : 'Đang dùng';
        const color = row.cancelDate ? '#6B7280' : expired ? '#EF4444' : '#059669';
        const bg = row.cancelDate ? '#F3F4F6' : expired ? '#FEE2E2' : '#D1FAE5';
        return <Chip label={label} size="small" sx={{ background: bg, color, fontWeight: 600, fontSize: 11, borderRadius: 1 }} />;
      },
    },
  ];

  return (
    <div className="animate-fadeIn">
      <PageHeader title="Liệu trình khách hàng" subtitle={`${treatments.length} liệu trình`} />
      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
        <DataGrid rows={treatments} columns={columns} getRowId={r => `${r.customerId}-${r.packageId}`}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }} pageSizeOptions={[10, 20]} autoHeight disableRowSelectionOnClick
          sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { background: 'var(--bg-tertiary)' } }}
          localeText={{ MuiTablePagination: { labelRowsPerPage: 'Hàng mỗi trang:', labelDisplayedRows: ({ from, to, count }: any) => `${from}–${to} / ${count}` }, noRowsLabel: 'Không có dữ liệu' } as any} />
      </div>
    </div>
  );
};

export default CustomerTreatmentsPage;
