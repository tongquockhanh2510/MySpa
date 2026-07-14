import React, { useEffect, useMemo, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { Alert, Box, Chip, InputAdornment, TextField } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SecurityIcon from '@mui/icons-material/Security';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import PageHeader from '@components/common/PageHeader';
import { getPermissions } from '@/api/accessControl';
import type { Permission } from '@/types';
import { toast } from 'sonner';
import './PermissionsPage.css';

const actionLabels: Record<string, string> = {
  VIEW: 'Xem',
  CREATE: 'Tao moi',
  UPDATE: 'Cap nhat',
  DELETE: 'Xoa',
  MANAGE: 'Quản lý',
};

const moduleLabels: Record<string, string> = {
  CUSTOMER: 'Khach hang',
  EMPLOYEE: 'Nhan vien',
  APPOINTMENT: 'Lich hen',
  ORDER: 'Don hang',
  REPORT: 'Bao cao',
  USER: 'Người dùng',
  ROLE: 'Vai trò',
};

const getPermissionParts = (name: string) => {
  const [action, ...moduleParts] = name.split('_');
  const moduleKey = moduleParts.join('_');

  return {
    action: actionLabels[action] ?? action,
    module: moduleLabels[moduleKey] ?? moduleKey,
  };
};

const PermissionsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadPermissions = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setPermissions(await getPermissions());
    } catch (error) {
      console.error(error);
      setLoadError('Không thể tải danh sách quyền. Vui lòng thử lại.');
      toast.error('Lỗi khi tải danh sách quyền');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadPermissions();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const permissionRows = useMemo(
    () =>
      permissions.map((permission) => ({
        ...permission,
        ...getPermissionParts(permission.name),
      })),
    [permissions]
  );

  const filteredRows = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase();
    if (!normalizedTerm) return permissionRows;

    return permissionRows.filter((permission) =>
      [permission.name, permission.description, permission.module, permission.action]
        .join(' ')
        .toLowerCase()
        .includes(normalizedTerm)
    );
  }, [permissionRows, searchTerm]);

  const modules = useMemo(() => new Set(permissionRows.map((permission) => permission.module)).size, [permissionRows]);
  const managementPermissions = useMemo(
    () => permissionRows.filter((permission) => permission.action === 'Quản lý').length,
    [permissionRows]
  );

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Mã quyền',
      minWidth: 220,
      flex: 0.8,
      renderCell: (params) => <strong className="permissions-page__code">{params.value}</strong>,
    },
    {
      field: 'module',
      headerName: 'Phân hệ',
      minWidth: 150,
      renderCell: (params) => <Chip size="small" label={params.value} className="permissions-page__chip" />,
    },
    {
      field: 'action',
      headerName: 'Thao tác',
      minWidth: 130,
    },
    {
      field: 'description',
      headerName: 'Mô tả',
      flex: 1,
      minWidth: 260,
      renderCell: (params) => <span className="permissions-page__description">{params.value}</span>,
    },
  ];

  return (
    <main className="permissions-page animate-fadeIn">
      <PageHeader title="Phân quyền hệ thống" subtitle={`${permissions.length} quyền hạn đang cấu hình`} />

      {loadError && <Alert severity="warning">{loadError}</Alert>}

      <section className="permissions-page__summary" aria-label="Tổng quan quyền hệ thống">
        <article className="permissions-page__summary-card">
          <SecurityIcon />
          <div>
            <span>Tổng quyền</span>
            <strong>{loading ? '...' : permissions.length}</strong>
          </div>
        </article>
        <article className="permissions-page__summary-card">
          <Inventory2Icon />
          <div>
            <span>Phân hệ</span>
            <strong>{loading ? '...' : modules}</strong>
          </div>
        </article>
        <article className="permissions-page__summary-card">
          <VpnKeyIcon />
          <div>
            <span>Quyền quản lý</span>
            <strong>{loading ? '...' : managementPermissions}</strong>
          </div>
        </article>
      </section>

      <section className="permissions-page__toolbar" aria-label="Bộ lọc quyền">
        <TextField
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Tìm theo mã quyền, phân hệ hoặc mô tả"
          size="small"
          className="permissions-page__search"
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
        <span>{filteredRows.length} quyền phù hợp</span>
      </section>

      <div className="permissions-page__panel">
        <Box sx={{ width: '100%' }}>
          <DataGrid
            rows={filteredRows}
            columns={columns}
            getRowId={(row) => row.name}
            autoHeight
            disableRowSelectionOnClick
            loading={loading}
            pageSizeOptions={[10, 25, 50]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            sx={{
              border: 'none',
              '& .MuiDataGrid-columnHeaders': {
                background: 'var(--bg-tertiary)',
              },
            }}
            localeText={{ noRowsLabel: 'Không có quyền phù hợp' }}
          />
        </Box>
      </div>
    </main>
  );
};

export default PermissionsPage;
