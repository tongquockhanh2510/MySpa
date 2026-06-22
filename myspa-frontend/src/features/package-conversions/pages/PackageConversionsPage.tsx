import React, { useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { Chip } from '@mui/material';
import PageHeader from '@components/common/PageHeader';
import { formatDate, getConversionTypeLabel } from '@utils/formatters';
import { ConversionType } from '@/types';
import type { PackageConversion } from '@/types';

const mockConversions: PackageConversion[] = [
  { conversionId: 'CV001', conversionType: ConversionType.TO_SERVICE, conversionValue: 350000, conversionDate: '2024-02-15', note: 'Đổi buổi còn lại sang dịch vụ chăm sóc da' },
  { conversionId: 'CV002', conversionType: ConversionType.TO_PRODUCT, conversionValue: 280000, conversionDate: '2024-03-01', note: 'Đổi buổi còn lại lấy sản phẩm dưỡng da' },
  { conversionId: 'CV003', conversionType: ConversionType.TO_SERVICE, conversionValue: 400000, conversionDate: '2024-03-20', note: 'Chuyển sang dịch vụ massage' },
];

const PackageConversionsPage: React.FC = () => {
  const [conversions] = useState<PackageConversion[]>(mockConversions);

  const columns: GridColDef[] = [
    { field: 'conversionId', headerName: 'Mã chuyển đổi', width: 140 },
    {
      field: 'conversionType', headerName: 'Loại chuyển đổi', width: 200,
      renderCell: ({ value }) => {
        const isService = value === ConversionType.TO_SERVICE;
        return <Chip label={getConversionTypeLabel(value)} size="small" sx={{ background: isService ? '#DBEAFE' : '#D1FAE5', color: isService ? '#2563EB' : '#059669', fontWeight: 600, fontSize: 11, borderRadius: 1 }} />;
      },
    },
    { field: 'conversionValue', headerName: 'Giá trị (VNĐ)', width: 150, renderCell: ({ value }) => <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{value.toLocaleString('vi-VN')} ₫</span> },
    { field: 'conversionDate', headerName: 'Ngày chuyển đổi', width: 150, renderCell: ({ value }) => formatDate(value) },
    { field: 'note', headerName: 'Ghi chú', flex: 1 },
  ];

  return (
    <div className="animate-fadeIn">
      <PageHeader title="Chuyển đổi liệu trình" subtitle={`${conversions.length} lần chuyển đổi`} />
      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
        <DataGrid rows={conversions} columns={columns} getRowId={r => r.conversionId}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }} pageSizeOptions={[10, 20]} autoHeight disableRowSelectionOnClick
          sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { background: 'var(--bg-tertiary)' } }}
          localeText={{ MuiTablePagination: { labelRowsPerPage: 'Hàng mỗi trang:', labelDisplayedRows: ({ from, to, count }: any) => `${from}–${to} / ${count}` }, noRowsLabel: 'Không có dữ liệu' } as any} />
      </div>
    </div>
  );
};

export default PackageConversionsPage;
