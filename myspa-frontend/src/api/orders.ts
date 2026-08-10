import axiosInstance from './axiosInstance';

export interface OrderItemRequest {
  itemType: 'SERVICE' | 'PACKAGE' | 'PRODUCT';
  productId?: string;
  serviceId?: string;
  packageId?: string;
  quantity: number;
  therapistId?: string;
  roomId?: string;
  scheduledDateTime?: string;
}

export interface OrderRequest {
  appointmentId?: string;
  customerId?: string;
  newCustomer?: any;
  items: OrderItemRequest[];
  voucherCode?: string;
  promotionId?: string;
}

export const createOrder = async (orderData: OrderRequest) => {
  const response = await axiosInstance.post('/orders', orderData);
  return response.data.result;
};

export const payOrder = async (orderId: string, paymentData: {
  amount: number;
  paymentMethod: string;
  transactionReference?: string;
  notes?: string;
}) => {
  const response = await axiosInstance.post(`/orders/${orderId}/payments`, paymentData);
  return response.data.result;
};

export const refundOrder = async (orderId: string, reason?: string) => {
  const response = await axiosInstance.post(`/orders/${orderId}/refund`, null, {
    params: reason ? { reason } : undefined,
  });
  return response.data.result;
};

export const getOrderById = async (orderId: string) => {
  const response = await axiosInstance.get(`/orders/${orderId}`);
  return response.data.result;
};

export const getOrders = async () => {
  const response = await axiosInstance.get('/orders');
  return response.data.result || [];
};

export interface BankQrInfo {
  orderId: string;
  amount: number;
  memo: string;
  qrUrl: string;
  bankBin: string;
  accountNumber: string;
  accountName: string;
}

export const getBankQr = async (orderId: string): Promise<BankQrInfo> => {
  const response = await axiosInstance.get(`/payments/bank-qr/${orderId}`);
  return response.data.result;
};
