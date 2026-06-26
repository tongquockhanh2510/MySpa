import axiosInstance from './axiosInstance';
import type { AmountPromotionFormData, PercentPromotionFormData } from '@/types';

export type PromotionFormData = (AmountPromotionFormData | PercentPromotionFormData) & {
  type: 'AMOUNT' | 'PERCENT';
};

export const getPromotions = async () => {
  const response = await axiosInstance.get('/promotions');
  return response.data.result || [];
};

export const createPromotion = async (data: PromotionFormData) => {
  const response = await axiosInstance.post('/promotions', data);
  return response.data.result;
};

export const updatePromotion = async (id: string, data: PromotionFormData) => {
  const response = await axiosInstance.put(`/promotions/${id}`, data);
  return response.data.result;
};

export const deletePromotion = async (id: string) => {
  const response = await axiosInstance.delete(`/promotions/${id}`);
  return response.data;
};
