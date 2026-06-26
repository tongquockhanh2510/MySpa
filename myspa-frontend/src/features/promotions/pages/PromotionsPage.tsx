import React, { useEffect, useMemo, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, IconButton, InputLabel, MenuItem, Select, Tab, Tabs, TextField } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import PageHeader from '@components/common/PageHeader';
import ConfirmDialog from '@components/common/ConfirmDialog';
import { createPromotion, deletePromotion, getPromotions, type PromotionFormData } from '@/api/promotions';
import { formatCurrency, formatDateTime } from '@utils/formatters';
import type { Promotion } from '@/types';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';

const inputSx = { '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: 14 }, '& .MuiInputLabel-root': { fontSize: 14 } };

const PromotionsPage: React.FC = () => {
  const [tab, setTab] = useState(0);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Promotion | null>(null);
  const [type, setType] = useState<'AMOUNT' | 'PERCENT'>('AMOUNT');

  const { control, handleSubmit, reset, watch } = useForm<PromotionFormData>({
    defaultValues: {
      type: 'AMOUNT',
      name: '',
      code: '',
      minOrderValue: 0,
      effective: '',
      expiration: '',
      quantity: 1,
      isActive: true,
      discount: 0,
      percent: 0,
      maxDiscount: 0,
      applyScope: 'ORDER',
      targetType: '',
      targetId: '',
    },
  });

  const applyScope = watch('applyScope');

  const loadPromotions = async () => {
    try {
      setPromotions(await getPromotions());
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải danh sách khuyến mãi');
    }
  };

  useEffect(() => {
    loadPromotions();
  }, []);

  const amountPromotions = useMemo(() => promotions.filter(p => p.type === 'AMOUNT'), [promotions]);
  const percentPromotions = useMemo(() => promotions.filter(p => p.type === 'PERCENT'), [promotions]);

  const openCreate = () => {
    setType(tab === 0 ? 'AMOUNT' : 'PERCENT');
    reset({
      type: tab === 0 ? 'AMOUNT' : 'PERCENT',
      name: '',
      code: '',
      minOrderValue: 0,
      effective: '',
      expiration: '',
      quantity: 1,
      isActive: true,
      discount: 0,
      percent: 0,
      maxDiscount: 0,
      applyScope: 'ORDER',
      targetType: '',
      targetId: '',
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: PromotionFormData) => {
    try {
      const payload = { ...data, type };
      const saved = await createPromotion(payload);
      setPromotions(prev => [saved, ...prev]);
      toast.success('Thêm khuyến mãi thành công');
      setDialogOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Thêm khuyến mãi thất bại');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePromotion(deleteTarget.promotionId);
      setPromotions(prev => prev.filter(promotion => promotion.promotionId !== deleteTarget.promotionId));
      toast.success('Đã ngừng khuyến mãi');
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
      toast.error('Xóa khuyến mãi thất bại');
    }
  };

  const statusCell = ({ value }: any) => (
    <Chip
      icon={value ? <CheckCircleIcon sx={{ fontSize: 14, color: '#059669 !important' }} /> : <CancelIcon sx={{ fontSize: 14, color: '#DC2626 !important' }} />}
      label={value ? 'Đang áp dụng' : 'Đã tắt'}
      size="small"
      sx={{ background: value ? '#D1FAE5' : '#FEE2E2', color: value ? '#059669' : '#DC2626', fontWeight: 600, fontSize: 11, borderRadius: 1 }}
    />
  );

  const actionColumn: GridColDef = {
    field: 'actions',
    headerName: 'Thao tác',
    width: 90,
    sortable: false,
    renderCell: ({ row }) => <IconButton size="small" onClick={() => setDeleteTarget(row)} sx={{ color: '#EF4444' }}><DeleteIcon fontSize="small" /></IconButton>,
  };

  const baseColumns: GridColDef[] = [
    { field: 'name', headerName: 'Tên khuyến mãi', flex: 1, minWidth: 200 },
    { field: 'code', headerName: 'Mã code', width: 140, renderCell: ({ value }) => <code style={{ background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{value}</code> },
    { field: 'applyScope', headerName: 'Áp dụng', width: 120, renderCell: ({ value }) => value === 'ITEM' ? 'Theo mặt hàng' : 'Toàn đơn' },
    { field: 'minOrderValue', headerName: 'Đơn tối thiểu', width: 140, renderCell: ({ value }) => formatCurrency(value || 0) },
    { field: 'effective', headerName: 'Bắt đầu', width: 150, renderCell: ({ value }) => value ? formatDateTime(value) : '' },
    { field: 'expiration', headerName: 'Kết thúc', width: 150, renderCell: ({ value }) => value ? formatDateTime(value) : '' },
    { field: 'quantity', headerName: 'Số lượng', width: 100, align: 'center', headerAlign: 'center' },
    { field: 'isActive', headerName: 'Trạng thái', width: 140, renderCell: statusCell },
    actionColumn,
  ];

  const amountColumns: GridColDef[] = [
    ...baseColumns.slice(0, 1),
    { field: 'discount', headerName: 'Giảm (VNĐ)', width: 130, renderCell: ({ value }) => <span style={{ fontWeight: 700, color: '#EF4444' }}>-{formatCurrency(value || 0)}</span> },
    ...baseColumns.slice(1),
  ];

  const percentColumns: GridColDef[] = [
    ...baseColumns.slice(0, 1),
    { field: 'percent', headerName: 'Giảm (%)', width: 100, renderCell: ({ value }) => <span style={{ fontWeight: 700, color: '#EF4444' }}>-{value || 0}%</span> },
    { field: 'maxDiscount', headerName: 'Giảm tối đa', width: 130, renderCell: ({ value }) => formatCurrency(value || 0) },
    ...baseColumns.slice(1),
  ];

  const gridSx = { border: 'none', '& .MuiDataGrid-columnHeaders': { background: 'var(--bg-tertiary)' } };

  return (
    <div className="animate-fadeIn">
      <PageHeader title="Quản lý khuyến mãi" subtitle="Giảm theo số tiền và phần trăm" action={{ label: 'Thêm khuyến mãi', onClick: openCreate, icon: <AddIcon fontSize="small" /> }} />
      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
        <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ borderBottom: '1px solid var(--border-color)', px: 2, '& .MuiTab-root': { textTransform: 'none', fontFamily: 'inherit', fontWeight: 500, fontSize: 14 }, '& .Mui-selected': { color: 'var(--primary) !important', fontWeight: 600 }, '& .MuiTabs-indicator': { background: 'var(--primary)' } }}>
          <Tab label={`Giảm tiền trực tiếp (${amountPromotions.length})`} />
          <Tab label={`Giảm theo phần trăm (${percentPromotions.length})`} />
        </Tabs>
        <Box>
          {tab === 0 && <DataGrid rows={amountPromotions} columns={amountColumns} getRowId={r => r.promotionId} initialState={{ pagination: { paginationModel: { pageSize: 10 } } }} pageSizeOptions={[10, 20]} autoHeight disableRowSelectionOnClick sx={gridSx} />}
          {tab === 1 && <DataGrid rows={percentPromotions} columns={percentColumns} getRowId={r => r.promotionId} initialState={{ pagination: { paginationModel: { pageSize: 10 } } }} pageSizeOptions={[10, 20]} autoHeight disableRowSelectionOnClick sx={gridSx} />}
        </Box>
      </div>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} slotProps={{ paper: { sx: { borderRadius: '16px', minWidth: 560, background: 'var(--bg-secondary)' } } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 17, pb: 0 }}>Thêm khuyến mãi</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <form noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <FormControl fullWidth size="small" sx={inputSx}>
              <InputLabel>Loại khuyến mãi</InputLabel>
              <Select value={type} label="Loại khuyến mãi" onChange={event => setType(event.target.value as 'AMOUNT' | 'PERCENT')}>
                <MenuItem value="AMOUNT">Giảm tiền cố định</MenuItem>
                <MenuItem value="PERCENT">Giảm phần trăm</MenuItem>
              </Select>
            </FormControl>
            <Controller name="name" control={control} render={({ field }) => <TextField {...field} label="Tên khuyến mãi" fullWidth size="small" sx={inputSx} />} />
            <Controller name="code" control={control} render={({ field }) => <TextField {...field} label="Mã code" fullWidth size="small" sx={inputSx} />} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Controller name="minOrderValue" control={control} render={({ field }) => <TextField {...field} onChange={e => field.onChange(Number(e.target.value))} label="Đơn tối thiểu" type="number" fullWidth size="small" sx={inputSx} />} />
              <Controller name="quantity" control={control} render={({ field }) => <TextField {...field} onChange={e => field.onChange(Number(e.target.value))} label="Số lượng" type="number" fullWidth size="small" sx={inputSx} />} />
              <Controller name="effective" control={control} render={({ field }) => <TextField {...field} label="Bắt đầu" type="datetime-local" fullWidth size="small" sx={inputSx} slotProps={{ inputLabel: { shrink: true } }} />} />
              <Controller name="expiration" control={control} render={({ field }) => <TextField {...field} label="Kết thúc" type="datetime-local" fullWidth size="small" sx={inputSx} slotProps={{ inputLabel: { shrink: true } }} />} />
              {type === 'AMOUNT' && <Controller name="discount" control={control} render={({ field }) => <TextField {...field} onChange={e => field.onChange(Number(e.target.value))} label="Số tiền giảm" type="number" fullWidth size="small" sx={inputSx} />} />}
              {type === 'PERCENT' && <Controller name="percent" control={control} render={({ field }) => <TextField {...field} onChange={e => field.onChange(Number(e.target.value))} label="Phần trăm giảm" type="number" fullWidth size="small" sx={inputSx} />} />}
              {type === 'PERCENT' && <Controller name="maxDiscount" control={control} render={({ field }) => <TextField {...field} onChange={e => field.onChange(Number(e.target.value))} label="Giảm tối đa" type="number" fullWidth size="small" sx={inputSx} />} />}
            </div>
            <Controller name="applyScope" control={control} render={({ field }) => <FormControl fullWidth size="small" sx={inputSx}><InputLabel>Phạm vi áp dụng</InputLabel><Select {...field} label="Phạm vi áp dụng"><MenuItem value="ORDER">Toàn đơn hàng</MenuItem><MenuItem value="ITEM">Theo sản phẩm/dịch vụ/gói</MenuItem></Select></FormControl>} />
            {applyScope === 'ITEM' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Controller name="targetType" control={control} render={({ field }) => <FormControl fullWidth size="small" sx={inputSx}><InputLabel>Loại đối tượng</InputLabel><Select {...field} label="Loại đối tượng"><MenuItem value="PRODUCT">Sản phẩm</MenuItem><MenuItem value="SERVICE">Dịch vụ</MenuItem><MenuItem value="PACKAGE">Gói liệu trình</MenuItem></Select></FormControl>} />
                <Controller name="targetId" control={control} render={({ field }) => <TextField {...field} label="Mã đối tượng" fullWidth size="small" sx={inputSx} />} />
              </div>
            )}
          </form>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ borderRadius: '10px', textTransform: 'none', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>Hủy</Button>
          <Button onClick={handleSubmit(onSubmit)} variant="contained" sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, background: 'linear-gradient(135deg, #D97706, #F59E0B)' }}>Thêm khuyến mãi</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog open={!!deleteTarget} title="Xóa khuyến mãi" message={`Bạn có chắc muốn ngừng khuyến mãi "${deleteTarget?.name}"?`} confirmLabel="Xóa" severity="error" onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
};

export default PromotionsPage;
