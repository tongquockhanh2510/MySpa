import axiosInstance from './axiosInstance';

export const getCustomerSchedules = async (customerId: string) => {
  const response = await axiosInstance.get(`/treatment-schedules/customer/${customerId}`);
  return response.data.result || [];
};

export const getTreatmentSchedules = async (from: string, to: string) => {
  const response = await axiosInstance.get('/treatment-schedules', { params: { from, to } });
  return response.data.result || [];
};

export const rescheduleTreatment = async (scheduleId: string, data: {
  date: string;
  therapistId?: string;
  roomId?: string;
}) => {
  const response = await axiosInstance.post(`/treatment-schedules/${scheduleId}/reschedule?date=${data.date}${data.therapistId ? `&therapistId=${data.therapistId}` : ''}${data.roomId ? `&roomId=${data.roomId}` : ''}`);
  return response.data.result;
};

export const checkInSession = async (scheduleId: string, therapistId?: string) => {
  const response = await axiosInstance.post(`/treatment-sessions/check-in?scheduleId=${scheduleId}${therapistId ? `&therapistId=${therapistId}` : ''}`);
  return response.data.result;
};

export const completeSession = async (sessionId: string, sessionData: {
  notes?: string;
  beforeImages?: string;
  afterImages?: string;
  result?: string;
}) => {
  const response = await axiosInstance.post(`/treatment-sessions/${sessionId}/complete`, sessionData);
  return response.data.result;
};

export const getSessionHistoryBySchedule = async (scheduleId: string) => {
  const response = await axiosInstance.get(`/treatment-sessions/schedule/${scheduleId}`);
  return response.data.result || [];
};
