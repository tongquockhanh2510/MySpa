import axiosInstance from './axiosInstance';
import type { EmployeeFormData, ProductFormData, ServiceFormData, TreatmentPackageFormData } from '@/types';

export const getServices = async () => {
  const response = await axiosInstance.get('/services');
  return response.data.result || [];
};

export const createService = async (data: ServiceFormData) => {
  const response = await axiosInstance.post('/services', data);
  return response.data.result;
};

export const updateService = async (id: string, data: ServiceFormData) => {
  const response = await axiosInstance.put(`/services/${id}`, data);
  return response.data.result;
};

export const deleteService = async (id: string) => {
  const response = await axiosInstance.delete(`/services/${id}`);
  return response.data;
};

export const getProducts = async () => {
  const response = await axiosInstance.get('/products');
  return response.data.result || [];
};

export const createProduct = async (data: ProductFormData) => {
  const response = await axiosInstance.post('/products', data);
  return response.data.result;
};

export const updateProduct = async (id: string, data: ProductFormData) => {
  const response = await axiosInstance.put(`/products/${id}`, data);
  return response.data.result;
};

export const deleteProduct = async (id: string) => {
  const response = await axiosInstance.delete(`/products/${id}`);
  return response.data;
};

export const uploadProductImage = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axiosInstance.post('/products/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.result as string;
};

export const getTreatmentPackages = async () => {
  const response = await axiosInstance.get('/treatment-packages');
  return response.data.result || [];
};

export const createTreatmentPackage = async (data: TreatmentPackageFormData) => {
  const response = await axiosInstance.post('/treatment-packages', data);
  return response.data.result;
};

export const updateTreatmentPackage = async (id: string, data: TreatmentPackageFormData) => {
  const response = await axiosInstance.put(`/treatment-packages/${id}`, data);
  return response.data.result;
};

export const deleteTreatmentPackage = async (id: string) => {
  const response = await axiosInstance.delete(`/treatment-packages/${id}`);
  return response.data;
};

export const getEmployees = async () => {
  const response = await axiosInstance.get('/employees');
  return response.data.result || [];
};

export const createEmployee = async (data: EmployeeFormData) => {
  const response = await axiosInstance.post('/employees', data);
  return response.data.result;
};

export const updateEmployee = async (id: string, data: EmployeeFormData) => {
  const response = await axiosInstance.put(`/employees/${id}`, data);
  return response.data.result;
};

export const deleteEmployee = async (id: string) => {
  const response = await axiosInstance.delete(`/employees/${id}`);
  return response.data.result;
};

export const createEmployeeAccount = async (
  employeeId: string,
  data: { userName: string; password: string; role: string },
) => {
  const response = await axiosInstance.post(`/employees/${employeeId}/account`, data);
  return response.data.result;
};

export const getRooms = async () => {
  const response = await axiosInstance.get('/rooms');
  return response.data.result || [];
};

export const getCategories = async () => {
  const response = await axiosInstance.get('/categories');
  return response.data.result || [];
};

export const createCategory = async (data: { name: string }) => {
  const response = await axiosInstance.post('/categories', data);
  return response.data.result;
};

export const updateCategory = async (id: string, data: { name: string }) => {
  const response = await axiosInstance.put(`/categories/${id}`, data);
  return response.data.result;
};

export const deleteCategory = async (id: string) => {
  const response = await axiosInstance.delete(`/categories/${id}`);
  return response.data;
};
