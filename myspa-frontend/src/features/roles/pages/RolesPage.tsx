import React, { useMemo, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { Chip, InputAdornment, TextField } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import GroupIcon from '@mui/icons-material/Group';
import SecurityIcon from '@mui/icons-material/Security';
import PageHeader from '@components/common/PageHeader';
import { mockRoles, mockUsers } from '@utils/mockData';
import type { Role } from '@/types';
import './RolesPage.css';

const RolesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const roleRows = useMemo(
    () =>
      mockRoles.map((role) => ({
        ...role,
        permissionCount: role.permissions.length,
        userCount: mockUsers.filter((user) => user.roles.some((userRole) => userRole.name === role.name)).length,
      })),
    []
  );

  const filteredRows = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase();

    if (!normalizedTerm) {
      return roleRows;
    }

    return roleRows.filter((role) =>
      [role.name, role.description, ...role.permissions.map((permission) => permission.name)]
        .join(' ')
        .toLowerCase()
        .includes(normalizedTerm)
    );
  }, [roleRows, searchTerm]);

  const totalPermissions = useMemo(
    () => new Set(mockRoles.flatMap((role) => role.permissions.map((permission) => permission.name))).size,
    []
  );

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Tên vai trò',
      minWidth: 170,
      renderCell: ({ value }) => <strong className="roles-page__role-name">{value}</strong>,
    },
    {
      field: 'description',
      headerName: 'Mô tả',
      flex: 1,
      minWidth: 220,
      renderCell: ({ value }) => <span className="roles-page__description">{value}</span>,
    },
    {
      field: 'userCount',
      headerName: 'Người dùng',
      width: 120,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'permissionCount',
      headerName: 'Số quyền',
      width: 110,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'permissions',
      headerName: 'Quyền hạn',
      flex: 1.5,
      minWidth: 320,
      renderCell: ({ value }) => {
        const permissions = value as Role['permissions'];

        return (
          <div className="roles-page__permissions">
            {permissions.slice(0, 5).map((permission) => (
              <Chip key={permission.name} label={permission.name} size="small" className="roles-page__permission-chip" />
            ))}
            {permissions.length > 5 && <Chip label={`+${permissions.length - 5}`} size="small" className="roles-page__more-chip" />}
          </div>
        );
      },
    },
  ];

  return (
    <main className="roles-page animate-fadeIn">
      <PageHeader title="Quản lý vai trò" subtitle={`${mockRoles.length} vai trò đang cấu hình`} />

      <section className="roles-page__summary" aria-label="Tổng quan vai trò">
        <article className="roles-page__summary-card">
          <AdminPanelSettingsIcon />
          <div>
            <span>Tổng vai trò</span>
            <strong>{mockRoles.length}</strong>
          </div>
        </article>
        <article className="roles-page__summary-card">
          <GroupIcon />
          <div>
            <span>Người dùng có vai trò</span>
            <strong>{mockUsers.length}</strong>
          </div>
        </article>
        <article className="roles-page__summary-card">
          <SecurityIcon />
          <div>
            <span>Quyền duy nhất</span>
            <strong>{totalPermissions}</strong>
          </div>
        </article>
      </section>

      <section className="roles-page__toolbar" aria-label="Bộ lọc vai trò">
        <TextField
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Tìm vai trò, mô tả hoặc mã quyền"
          size="small"
          className="roles-page__search"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
        <span>{filteredRows.length} vai trò phù hợp</span>
      </section>

      <div className="roles-page__panel">
        <DataGrid
          rows={filteredRows}
          columns={columns}
          getRowId={(row) => row.name}
          autoHeight
          disableRowSelectionOnClick
          pageSizeOptions={[10, 20]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              background: 'var(--bg-tertiary)',
            },
          }}
          localeText={{
            MuiTablePagination: {
              labelRowsPerPage: 'Hàng mỗi trang:',
              labelDisplayedRows: ({ from, to, count }: any) => `${from}-${to} / ${count}`,
            },
            noRowsLabel: 'Không có vai trò phù hợp',
          } as any}
        />
      </div>
    </main>
  );
};

export default RolesPage;
