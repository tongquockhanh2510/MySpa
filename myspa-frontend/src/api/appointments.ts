import axiosInstance from './axiosInstance';
import type { Appointment } from '@/types';

export interface AppointmentPayload {
  customerId: string;
  dateTime: string;
  roomId?: string | null;
  note?: string;
  details: Array<{
    serviceId: string;
    employeeId: string;
  }>;
}

interface AppointmentPageResult {
  content: Appointment[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
}

export const getAppointments = async (params?: { search?: string; status?: string; page?: number; size?: number }) => {
  const response = await axiosInstance.get('/appointments', {
    params: {
      page: 0,
      size: 200,
      ...params,
    },
  });
  const result = response.data.result as AppointmentPageResult | Appointment[];
  return Array.isArray(result) ? result : result?.content || [];
};

export const createAppointment = async (data: AppointmentPayload) => {
  const response = await axiosInstance.post('/appointments', data);
  return response.data.result as Appointment;
};

export const updateAppointment = async (id: string, data: AppointmentPayload) => {
  const response = await axiosInstance.put(`/appointments/${id}`, data);
  return response.data.result as Appointment;
};

export const cancelAppointment = async (id: string, reason = 'Khach hang yeu cau huy') => {
  const response = await axiosInstance.patch(`/appointments/${id}/cancel`, null, {
    params: { reason },
  });
  return response.data.result as Appointment;
};
