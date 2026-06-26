import React, { useEffect, useMemo, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import PageHeader from '@components/common/PageHeader';
import { createPackageConversion, getPackageConversions, type PackageConversionFormData } from '@/api/packageConversions';
import { getProducts, getTreatmentPackages } from '@/api/catalog';
import { getCustomerTreatments } from '@/api/customerTreatments';
import { formatCurrency, formatDate, getConversionTypeLabel } from '@utils/formatters';
import { ConversionType } from '@/types';
import type { CustomerTreatment, PackageConversion, Product, TreatmentPackage } from '@/types';

const inputSx = { '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: 14 }, '& .MuiInputLabel-root': { fontSize: 14 } };

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

  const { control, handleSubmit, reset, watch, setValue } = useForm<PackageConversionFormData>({
    defaultValues: { customerId: '', packageId: '', conversionType: ConversionType.TO_DISCOUNT, conversionValue: 0, targetProductId: '', targetPackageId: '', note: '' },
  });

  const conversionType = watch('conversionType');
  const customerId = watch('customerId');
  const packageId = watch('packageId');

  const activeTreatments = useMemo(() => customerTreatments.filter(treatment => treatment.remainingSessions > 0), [customerTreatments]);
  const selectedTreatment = activeTreatments.find(treatment => treatment.customerId === customerId && treatment.packageId === packageId);

  const loadData = async () => {
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
      toast.error('Lỗi khi tải dữ liệu chuyển đổi liệu trình');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedTreatment) return;
    const totalSessions = selectedTreatment.totalSessions ?? 0;
    const packagePrice = selectedTreatment.packagePrice ?? 0;
    const perSessionValue = totalSessions > 0
      ? packagePrice / totalSessions
      : 0;
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
    { field: 'customerName', headerName: 'Khách hàng', width: 180 },
    { field: 'packageName', headerName: 'Gói liệu trình', flex: 1, minWidth: 200 },
    {
      field: 'conversionType',
      headerName: 'Loại chuyển đổi',
      width: 220,
      renderCell: ({ value }) => {
        const isProduct = value === ConversionType.TO_PRODUCT;
        return <Chip label={conversionLabels[value as ConversionType] || getConversionTypeLabel(value)} size="small" sx={{ background: isProduct ? '#D1FAE5' : '#DBEAFE', color: isProduct ? '#059669' : '#2563EB', fontWeight: 600, fontSize: 11, borderRadius: 1 }} />;
      },
    },
    { field: 'conversionValue', headerName: 'Giá trị', width: 150, renderCell: ({ value }) => <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{formatCurrency(value || 0)}</span> },
    { field: 'conversionDate', headerName: 'Ngày chuyển đổi', width: 150, renderCell: ({ value }) => formatDate(value) },
    { field: 'note', headerName: 'Ghi chú', flex: 1 },
  ];

  const uniqueCustomers = activeTreatments.filter((item, index, arr) => arr.findIndex(other => other.customerId === item.customerId) === index);
  const packagesByCustomer = activeTreatments.filter(treatment => treatment.customerId === customerId);

  return (
    <div className="animate-fadeIn">
      <PageHeader title="Chuyển đổi liệu trình" subtitle={`${conversions.length} lần chuyển đổi`} action={{ label: 'Tạo chuyển đổi', onClick: openCreate }} />
      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
        <DataGrid rows={conversions} columns={columns} getRowId={r => r.conversionId} initialState={{ pagination: { paginationModel: { pageSize: 10 } } }} pageSizeOptions={[10, 20]} autoHeight disableRowSelectionOnClick sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { background: 'var(--bg-tertiary)' } }} />
      </div>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} slotProps={{ paper: { sx: { borderRadius: '16px', minWidth: 560, background: 'var(--bg-secondary)' } } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 17, pb: 0 }}>Tạo chuyển đổi liệu trình</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <form noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
            <Controller name="conversionValue" control={control} render={({ field }) => <TextField {...field} onChange={e => field.onChange(Number(e.target.value))} label="Giá trị quy đổi" type="number" fullWidth size="small" sx={inputSx} />} />
            <Controller name="note" control={control} render={({ field }) => <TextField {...field} label="Ghi chú" multiline rows={3} fullWidth size="small" sx={inputSx} />} />
          </form>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ borderRadius: '10px', textTransform: 'none', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>Hủy</Button>
          <Button onClick={handleSubmit(onSubmit)} variant="contained" disabled={!customerId || !packageId} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, background: 'linear-gradient(135deg, #D97706, #F59E0B)' }}>Chuyển đổi</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default PackageConversionsPage;
