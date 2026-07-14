import axiosInstance from './axiosInstance';

export const getDashboardStats = async (year?: number) => {
  const response = await axiosInstance.get('/dashboard/stats', { params: year ? { year } : undefined });
  return response.data.result;
};

export const getDailyRevenue = async (month: number, year: number) => {
  const response = await axiosInstance.get('/dashboard/daily-revenue', { params: { month, year } });
  return response.data.result || [];
};

export const getTopProducts = async (year: number, month?: number) => {
  const response = await axiosInstance.get('/dashboard/top-products', { params: { year, ...(month ? { month } : {}) } });
  return response.data.result || [];
};
