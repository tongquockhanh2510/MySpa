import axiosInstance from './axiosInstance';
import type { ConversionType } from '@/types';

export interface PackageConversionFormData {
  customerId: string;
  packageId: string;
  conversionType: ConversionType;
  conversionValue: number;
  targetProductId?: string;
  targetPackageId?: string;
  quantity?: number;
  note?: string;
}

export const getPackageConversions = async () => {
  const response = await axiosInstance.get('/package-conversions');
  return response.data.result || [];
};

export const createPackageConversion = async (data: PackageConversionFormData) => {
  const response = await axiosInstance.post('/package-conversions', data);
  return response.data.result;
};
