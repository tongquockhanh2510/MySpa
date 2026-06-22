import React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { Chip } from '@mui/material';
import PageHeader from '@components/common/PageHeader';
import { mockRoles } from '@utils/mockData';
import type { Role } from '@/types';

const RolesPage: React.FC = () => {
  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Tên vai trò', width: 180 },
    { field: 'description', headerName: 'Mô tả', flex: 1 },
    {
      field: 'permissions', headerName: 'Quyền hạn', flex: 2,
      renderCell: ({ value }) => (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', padding: '4px 0' }}>
          {(value as { name: string; description: string }[]).slice(0, 5).map(p => (
            <Chip key={p.name} label={p.name} size="small" sx={{ background: '#DBEAFE', color: '#2563EB', fontWeight: 500, fontSize: 10, borderRadius: 1, height: 20 }} />
          ))}
          {value.length > 5 && <Chip label={`+${value.length - 5}`} size="small" sx={{ background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)', fontSize: 10, borderRadius: 1, height: 20 }} />}
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fadeIn">
      <PageHeader title="Quản lý vai trò" subtitle={`${mockRoles.length} vai trò`} />
      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
        <DataGrid rows={mockRoles} columns={columns} getRowId={r => r.name} autoHeight disableRowSelectionOnClick
          sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { background: 'var(--bg-tertiary)' } }}
          localeText={{ MuiTablePagination: { labelRowsPerPage: 'Hàng mỗi trang:', labelDisplayedRows: ({ from, to, count }: any) => `${from}–${to} / ${count}` }, noRowsLabel: 'Không có dữ liệu' } as any} />
      </div>
    </div>
  );
};

export default RolesPage;
