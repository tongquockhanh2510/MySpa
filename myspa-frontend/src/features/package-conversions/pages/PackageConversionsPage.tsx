import React, { useEffect, useMemo, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { Alert, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, Skeleton, TextField } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import PageHeader from '@components/common/PageHeader';
import { createPackageConversion, getPackageConversions, type PackageConversionFormData } from '@/api/packageConversions';
import { getProducts, getTreatmentPackages } from '@/api/catalog';
import { getCustomerTreatments } from '@/api/customerTreatments';
import { formatCurrency, formatDate, getConversionTypeLabel } from '@utils/formatters';
import { ConversionType } from '@/types';
import type { CustomerTreatment, PackageConversion, Product, TreatmentPackage } from '@/types';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import DiscountIcon from '@mui/icons-material/Discount';
import './PackageConversionsPage.css';

const inputSx = {
  '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: 14 },
  '& .MuiInputLabel-root': { fontSize: 14 },
};

const conversionLabels: Record<ConversionType, string> = {
  [ConversionType.TO_SERVICE]: 'Đổi sang dịch vụ',
  [ConversionType.TO_PRODUCT]: 'Đổi sang sản phẩm',
  [ConversionType.TO_DISCOUNT]: 'Đổi thành tiền giảm đơn hàng',
  [ConversionType.TO_PACKAGE]: 'Đổi sang gói liệu trình khác',
};

const PackageConversionsPage: React.FC = () => {
  const [conversions, setConversions] = useState<PackageConversion[]>([]);
  const [customerTreatments, setCustomerTreatments] = useState<CustomerTreatment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [packages, setPackages] = useState<TreatmentPackage[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const { control, handleSubmit, reset, watch, setValue } = useForm<PackageConversionFormData>({
    defaultValues: { customerId: '', packageId: '', conversionType: ConversionType.TO_DISCOUNT, conversionValue: 0, targetProductId: '', targetPackageId: '', note: '' },
  });

  const conversionType = watch('conversionType');
  const customerId = watch('customerId');
  const packageId = watch('packageId');

  const activeTreatments = useMemo(() => customerTreatments.filter(treatment => treatment.remainingSessions > 0), [customerTreatments]);
  const selectedTreatment = activeTreatments.find(treatment => treatment.customerId === customerId && treatment.packageId === packageId);
  const uniqueCustomers = activeTreatments.filter((item, index, arr) => arr.findIndex(other => other.customerId === item.customerId) === index);
  const packagesByCustomer = activeTreatments.filter(treatment => treatment.customerId === customerId);

  const summary = useMemo(() => ({
    total: conversions.length,
    value: conversions.reduce((sum, item) => sum + Number(item.conversionValue || 0), 0),
    eligible: activeTreatments.length,
  }), [conversions, activeTreatments]);

  const loadData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [conversionData, treatmentData, productData, packageData] = await Promise.all([
        getPackageConversions(),
        getCustomerTreatments(),
        getProducts(),
        getTreatmentPackages(),
      ]);
      setConversions(conversionData);
      setCustomerTreatments(treatmentData);
      setProducts(productData);
      setPackages(packageData);
    } catch (err) {
      console.error(err);
      setLoadError('Không thể tải dữ liệu chuyển đổi liệu trình.');
      toast.error('Lỗi khi tải dữ liệu chuyển đổi liệu trình');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedTreatment) return;
    const totalSessions = selectedTreatment.totalSessions ?? 0;
    const packagePrice = selectedTreatment.packagePrice ?? 0;
    const perSessionValue = totalSessions > 0 ? packagePrice / totalSessions : 0;
    setValue('conversionValue', Math.round(perSessionValue * selectedTreatment.remainingSessions));
  }, [selectedTreatment, setValue]);

  const openCreate = () => {
    reset({ customerId: '', packageId: '', conversionType: ConversionType.TO_DISCOUNT, conversionValue: 0, targetProductId: '', targetPackageId: '', note: '' });
    setDialogOpen(true);
  };

  const onSubmit = async (data: PackageConversionFormData) => {
    try {
      const saved = await createPackageConversion(data);
      setConversions(prev => [saved, ...prev]);
      setCustomerTreatments(prev => prev.map(treatment =>
        treatment.customerId === data.customerId && treatment.packageId === data.packageId
          ? { ...treatment, remainingSessions: 0, packageConversionId: saved.conversionId }
          : treatment
      ));
      toast.success('Chuyển đổi liệu trình thành công');
      setDialogOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Chuyển đổi liệu trình thất bại');
    }
  };

  const columns: GridColDef[] = [
    { field: 'conversionId', headerName: 'Mã chuyển đổi', width: 160 },
    {
      field: 'customerName',
      headerName: 'Khách hàng',
      width: 190,
      renderCell: ({ value }) => <span className="conversions-strong-cell">{value}</span>,
    },
    { field: 'packageName', headerName: 'Gói liệu trình', flex: 1, minWidth: 220 },
    {
      field: 'conversionType',
      headerName: 'Loại chuyển đổi',
      width: 230,
      renderCell: ({ value }) => {
        const isProduct = value === ConversionType.TO_PRODUCT;
        return <Chip label={conversionLabels[value as ConversionType] || getConversionTypeLabel(value)} size="small" className={isProduct ? 'conversions-chip conversions-chip--green' : 'conversions-chip'} />;
      },
    },
    { field: 'conversionValue', headerName: 'Giá trị', width: 150, renderCell: ({ value }) => <span className="conversions-money">{formatCurrency(value || 0)}</span> },
    { field: 'conversionDate', headerName: 'Ngày chuyển đổi', width: 150, renderCell: ({ value }) => formatDate(value) },
    { field: 'note', headerName: 'Ghi chú', flex: 1, minWidth: 180 },
  ];

  return (
    <main className="conversions-page animate-fadeIn">
      <PageHeader title="Chuyển đổi liệu trình" subtitle={`${conversions.length} lần chuyển đổi`} action={{ label: 'Tạo chuyển đổi', onClick: openCreate }} />

      {loadError && <Alert severity="warning" className="conversions-alert">{loadError}</Alert>}

      <section className="conversions-summary" aria-label="Tóm tắt chuyển đổi">
        <div className="conversions-summary-card"><span><SwapHorizIcon /></span><div><strong>{loading ? '...' : summary.total}</strong><p>Lần chuyển đổi</p></div></div>
        <div className="conversions-summary-card"><span><DiscountIcon /></span><div><strong>{loading ? '...' : formatCurrency(summary.value)}</strong><p>Giá trị quy đổi</p></div></div>
        <div className="conversions-summary-card"><span><CardGiftcardIcon /></span><div><strong>{loading ? '...' : summary.eligible}</strong><p>Liệu trình còn buổi</p></div></div>
      </section>

      <section className="conversions-panel">
        {loading ? (
          <div className="conversions-skeleton" aria-busy="true" aria-label="Đang tải chuyển đổi">
            {Array.from({ length: 7 }).map((_, index) => <Skeleton key={index} variant="rounded" height={48} />)}
          </div>
        ) : (
          <DataGrid rows={conversions} columns={columns} getRowId={row => row.conversionId}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }} pageSizeOptions={[10, 20]} autoHeight disableRowSelectionOnClick
            sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { background: 'var(--bg-tertiary)' } }}
            localeText={{ noRowsLabel: 'Chưa có chuyển đổi liệu trình' }} />
        )}
      </section>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} slotProps={{ paper: { sx: { borderRadius: '16px', width: 'min(580px, calc(100vw - 32px))', background: 'var(--bg-secondary)' } } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: 17, pb: 0 }}>Tạo chuyển đổi liệu trình</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <form noValidate className="conversions-form">
            <Controller name="customerId" control={control} render={({ field }) => (
              <FormControl fullWidth size="small" sx={inputSx}>
                <InputLabel>Khách hàng</InputLabel>
                <Select {...field} label="Khách hàng" onChange={event => { field.onChange(event); setValue('packageId', ''); }}>
                  {uniqueCustomers.map(treatment => <MenuItem key={treatment.customerId} value={treatment.customerId}>{treatment.customerName}</MenuItem>)}
                </Select>
              </FormControl>
            )} />
            <Controller name="packageId" control={control} render={({ field }) => (
              <FormControl fullWidth size="small" sx={inputSx}>
                <InputLabel>Gói liệu trình còn buổi</InputLabel>
                <Select {...field} label="Gói liệu trình còn buổi">
                  {packagesByCustomer.map(treatment => <MenuItem key={treatment.packageId} value={treatment.packageId}>{treatment.packageName} - còn {treatment.remainingSessions} buổi</MenuItem>)}
                </Select>
              </FormControl>
            )} />
            <Controller name="conversionType" control={control} render={({ field }) => (
              <FormControl fullWidth size="small" sx={inputSx}>
                <InputLabel>Kiểu chuyển đổi</InputLabel>
                <Select {...field} label="Kiểu chuyển đổi">
                  <MenuItem value={ConversionType.TO_DISCOUNT}>Đổi thành tiền giảm đơn hàng</MenuItem>
                  <MenuItem value={ConversionType.TO_PRODUCT}>Đổi sang sản phẩm</MenuItem>
                  <MenuItem value={ConversionType.TO_PACKAGE}>Đổi sang gói liệu trình khác</MenuItem>
                </Select>
              </FormControl>
            )} />
            {conversionType === ConversionType.TO_PRODUCT && (
              <Controller name="targetProductId" control={control} render={({ field }) => (
                <FormControl fullWidth size="small" sx={inputSx}>
                  <InputLabel>Sản phẩm nhận</InputLabel>
                  <Select {...field} label="Sản phẩm nhận">
                    {products.map(product => <MenuItem key={product.productId} value={product.productId}>{product.name}</MenuItem>)}
                  </Select>
                </FormControl>
              )} />
            )}
            {conversionType === ConversionType.TO_PACKAGE && (
              <Controller name="targetPackageId" control={control} render={({ field }) => (
                <FormControl fullWidth size="small" sx={inputSx}>
                  <InputLabel>Gói liệu trình mới</InputLabel>
                  <Select {...field} label="Gói liệu trình mới">
                    {packages.map(pack => <MenuItem key={pack.treatmentPackageId} value={pack.treatmentPackageId}>{pack.packageName}</MenuItem>)}
                  </Select>
                </FormControl>
              )} />
            )}
            <Controller name="conversionValue" control={control} render={({ field }) => <TextField {...field} onChange={event => field.onChange(Number(event.target.value))} label="Giá trị quy đổi" type="number" fullWidth size="small" sx={inputSx} />} />
            <Controller name="note" control={control} render={({ field }) => <TextField {...field} label="Ghi chú" multiline rows={3} fullWidth size="small" sx={inputSx} />} />
          </form>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ borderRadius: '10px', textTransform: 'none', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>Hủy</Button>
          <Button onClick={handleSubmit(onSubmit)} variant="contained" disabled={!customerId || !packageId} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, background: 'linear-gradient(135deg, #D97706, #F59E0B)' }}>Chuyển đổi</Button>
        </DialogActions>
      </Dialog>
    </main>
  );
};

export default PackageConversionsPage;
