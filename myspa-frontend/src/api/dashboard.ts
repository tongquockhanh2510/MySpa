import axiosInstance from './axiosInstance';

export const getDashboardStats = async (year?: number) => {
  const response = await axiosInstance.get('/dashboard/stats', { params: year ? { year } : undefined });
  return response.data.result;
};
