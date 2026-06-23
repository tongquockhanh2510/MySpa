import axiosInstance from './axiosInstance';

export const getCustomerTreatments = async () => {
  const response = await axiosInstance.get('/customer-treatments');
  return response.data.result || [];
};

export const getCustomerTreatmentsByCustomer = async (customerId: string) => {
  const response = await axiosInstance.get(`/customer-treatments/customer/${customerId}`);
  return response.data.result || [];
};
