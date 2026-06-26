import axiosInstance from './axiosInstance';

export const getServices = async () => {
  const response = await axiosInstance.get('/services');
  return response.data.result || [];
};

export const getProducts = async () => {
  const response = await axiosInstance.get('/products');
  return response.data.result || [];
};

export const getTreatmentPackages = async () => {
  const response = await axiosInstance.get('/treatment-packages');
  return response.data.result || [];
};

export const getEmployees = async () => {
  const response = await axiosInstance.get('/employees');
  return response.data.result || [];
};

export const getRooms = async () => {
  const response = await axiosInstance.get('/rooms');
  return response.data.result || [];
};

export const getCategories = async () => {
  const response = await axiosInstance.get('/categories');
  return response.data.result || [];
};
