import axiosInstance from './axiosInstance';

export interface Customer {
  customerId: string;
  name: string;
  phone: string;
  email: string;
  gender: string;
  dateOfBirth: string;
  address: string;
  skinType?: string;
  allergyInfo?: string;
  note?: string;
  loyaltyPoints: number;
  isActive: boolean;
  membershipTier?: string;
}

export const getCustomers = async (search = '') => {
  const response = await axiosInstance.get(`/customers?search=${encodeURIComponent(search)}&size=100`);
  return response.data.result?.content || [];
};

export const getCustomerById = async (id: string) => {
  const response = await axiosInstance.get(`/customers/${id}`);
  return response.data.result;
};

export const createCustomer = async (data: any) => {
  const response = await axiosInstance.post('/customers', data);
  return response.data.result;
};

export const updateCustomer = async (id: string, data: any) => {
  const response = await axiosInstance.put(`/customers/${id}`, data);
  return response.data.result;
};

export const deleteCustomer = async (id: string) => {
  const response = await axiosInstance.delete(`/customers/${id}`);
  return response.data.result;
};
