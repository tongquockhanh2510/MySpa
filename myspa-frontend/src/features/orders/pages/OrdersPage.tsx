import React, { useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { toast } from 'sonner';
import PageHeader from '@components/common/PageHeader';
import StatusChip from '@components/common/StatusChip';
import { mockOrders } from '@utils/mockData';
import { formatCurrency, formatDateTime, getOrderTypeLabel } from '@utils/formatters';
import type { Order } from '@/types';
import ReceiptIcon from '@mui/icons-material/Receipt';

const OrdersPage: React.FC = () => {
  const [orders] = useState<Order[]>(mockOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');

  const handlePayment = () => {
    toast.success(`Thanh toán ${Number(payAmount).toLocaleString('vi-VN')} ₫ thành công`);
    setPaymentOpen(false);
    setPayAmount('');
  };

  const columns: GridColDef[] = [
    { field: 'orderId', headerName: 'Mã đơn', width: 110 },
    { field: 'customerName', headerName: 'Khách hàng', flex: 1, minWidth: 160 },
    { field: 'typeOfOrder', headerName: 'Loại đơn', width: 160, renderCell: ({ value }) => <span style={{ fontSize: 12.5 }}>{getOrderTypeLabel(value)}</span> },
    { field: 'totalAmount', headerName: 'Tổng tiền', width: 140, renderCell: ({ value }) => <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{formatCurrency(value)}</span> },
    { field: 'paidAmount', headerName: 'Đã thanh toán', width: 140, renderCell: ({ value }) => <span style={{ fontWeight: 600, color: '#059669' }}>{formatCurrency(value)}</span> },
    { field: 'remainingAmount', headerName: 'Còn lại', width: 130, renderCell: ({ value }) => <span style={{ fontWeight: 600, color: value > 0 ? '#EF4444' : '#059669' }}>{formatCurrency(value)}</span> },
    { field: 'orderStatus', headerName: 'Trạng thái', width: 160, renderCell: ({ value }) => <StatusChip status={value} type="order" /> },
    { field: 'createdAt', headerName: 'Ngày tạo', width: 150, renderCell: ({ value }) => formatDateTime(value) },
    {
      field: 'actions', headerName: 'Thao tác', width: 140, sortable: false,
      renderCell: ({ row }) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <Button size="small" onClick={() => setSelectedOrder(row)} startIcon={<ReceiptIcon />}
            sx={{ borderRadius: 2, textTransform: 'none', fontFamily: 'inherit', fontSize: 12, color: 'var(--primary)', border: '1px solid rgba(217,119,6,0.3)', px: 1 }}>
            Chi tiết
          </Button>
          {(row.orderStatus === 'UNPAID' || row.orderStatus === 'PARTIALLY_PAIN') && (
            <Button size="small" onClick={() => { setSelectedOrder(row); setPaymentOpen(true); }}
              sx={{ borderRadius: 2, textTransform: 'none', fontFamily: 'inherit', fontSize: 12, background: 'linear-gradient(135deg, #D97706, #F59E0B)', color: '#fff', px: 1, '&:hover': { background: '#B45309' } }}>
              Thanh toán
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fadeIn">
      <PageHeader title="Quản lý đơn hàng" subtitle={`${orders.length} đơn hàng`} />
      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
        <DataGrid rows={orders} columns={columns} getRowId={r => r.orderId}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }} pageSizeOptions={[10, 20]} autoHeight disableRowSelectionOnClick
          sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { background: 'var(--bg-tertiary)' } }}
          localeText={{ MuiTablePagination: { labelRowsPerPage: 'Hàng mỗi trang:', labelDisplayedRows: ({ from, to, count }: any) => `${from}–${to} / ${count}` }, noRowsLabel: 'Không có đơn hàng' } as any} />
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder && !paymentOpen} onClose={() => setSelectedOrder(null)} slotProps={{ paper: { sx: { borderRadius: '16px', minWidth: 500, background: 'var(--bg-secondary)' } } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 17, pb: 0 }}>Chi tiết đơn hàng #{selectedOrder?.orderId}</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          {selectedOrder && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Khách hàng</p><p style={{ fontWeight: 600 }}>{selectedOrder.customerName}</p></div>
                <div><p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Loại đơn</p><p style={{ fontWeight: 600 }}>{getOrderTypeLabel(selectedOrder.typeOfOrder)}</p></div>
                <div><p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Tổng tiền</p><p style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 18 }}>{formatCurrency(selectedOrder.totalAmount)}</p></div>
                <div><p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Trạng thái</p><StatusChip status={selectedOrder.orderStatus} type="order" /></div>
                <div><p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Đã thanh toán</p><p style={{ fontWeight: 600, color: '#059669' }}>{formatCurrency(selectedOrder.paidAmount)}</p></div>
                <div><p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Còn lại</p><p style={{ fontWeight: 600, color: '#EF4444' }}>{formatCurrency(selectedOrder.remainingAmount)}</p></div>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setSelectedOrder(null)} sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'inherit', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>Đóng</Button>
          <Button onClick={() => window.print()} sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'inherit', background: 'linear-gradient(135deg, #D97706, #F59E0B)', color: '#fff', fontWeight: 600 }}>In hóa đơn</Button>
        </DialogActions>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentOpen} onClose={() => setPaymentOpen(false)} slotProps={{ paper: { sx: { borderRadius: '16px', minWidth: 400, background: 'var(--bg-secondary)' } } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 17, pb: 0 }}>Thanh toán đơn #{selectedOrder?.orderId}</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>Số tiền còn lại: <strong style={{ color: '#EF4444' }}>{formatCurrency(selectedOrder?.remainingAmount ?? 0)}</strong></p>
          <TextField label="Số tiền thanh toán (VNĐ)" type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} fullWidth size="small"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setPaymentOpen(false)} sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'inherit', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>Hủy</Button>
          <Button onClick={handlePayment} disabled={!payAmount || Number(payAmount) <= 0} variant="contained"
            sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'inherit', fontWeight: 600, background: 'linear-gradient(135deg, #D97706, #F59E0B)' }}>Xác nhận thanh toán</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default OrdersPage;
