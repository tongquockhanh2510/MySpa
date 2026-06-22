import React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import PageHeader from '@components/common/PageHeader';
import { mockPermissions } from '@utils/mockData';

const PermissionsPage: React.FC = () => {
  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Tên quyền', width: 220 },
    { field: 'description', headerName: 'Mô tả', flex: 1 },
  ];

  return (
    <div className="animate-fadeIn">
      <PageHeader title="Phân quyền hệ thống" subtitle={`${mockPermissions.length} quyền hạn`} />
      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
        <DataGrid rows={mockPermissions} columns={columns} getRowId={r => r.name} autoHeight disableRowSelectionOnClick
          sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { background: 'var(--bg-tertiary)' } }}
          localeText={{ MuiTablePagination: { labelRowsPerPage: 'Hàng mỗi trang:', labelDisplayedRows: ({ from, to, count }: any) => `${from}–${to} / ${count}` }, noRowsLabel: 'Không có dữ liệu' } as any} />
      </div>
    </div>
  );
};

export default PermissionsPage;
