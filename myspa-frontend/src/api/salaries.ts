import axiosInstance from './axiosInstance';

export interface EmployeeSalary {
  employeeId: string;
  employeeName: string;
  position: string | null;
  month: number;
  year: number;
  baseSalary: number;
  totalCommission: number;
  commissionCount: number;
  totalSalary: number;
}

export interface CommissionDetail {
  commissionId: string;
  employeeId: string;
  employeeName: string;
  commissionType: 'SERVICE' | 'PRODUCT' | 'PACKAGE' | 'REFERRAL';
  baseAmount: number;
  commissionRate: number;
  commissionAmount: number;
  referenceId: string;
  description: string;
  month: number;
  year: number;
  paid: boolean;
  createdAt: string;
}

export const getSalarySummary = async (month: number, year: number): Promise<EmployeeSalary[]> => {
  const response = await axiosInstance.get('/salaries', { params: { month, year } });
  return response.data.result || [];
};

export const getMySalarySummary = async (month: number, year: number): Promise<EmployeeSalary[]> => {
  const response = await axiosInstance.get('/salaries/me', { params: { month, year } });
  return response.data.result ? [response.data.result] : [];
};

export const backfillCommissions = async (): Promise<number> => {
  const response = await axiosInstance.post('/salaries/commissions/backfill');
  return response.data.result ?? 0;
};

export const getCommissionDetails = async (
  employeeId: string,
  month: number,
  year: number,
): Promise<CommissionDetail[]> => {
  const response = await axiosInstance.get(`/salaries/${employeeId}/commissions`, { params: { month, year } });
  return response.data.result || [];
};

export const getMyCommissionDetails = async (
  month: number,
  year: number,
): Promise<CommissionDetail[]> => {
  const response = await axiosInstance.get('/salaries/me/commissions', { params: { month, year } });
  return response.data.result || [];
};
