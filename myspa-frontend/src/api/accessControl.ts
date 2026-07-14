import axiosInstance from './axiosInstance';
import type { Permission, Role, User } from '@/types';

export const getUsers = async () => {
  const response = await axiosInstance.get('/users');
  return response.data.result as User[];
};

export const deactivateUser = async (id: string) => {
  const response = await axiosInstance.delete(`/users/${id}`);
  return response.data.result as User;
};

export const updateUserRoles = async (id: string, roles: string[]) => {
  const response = await axiosInstance.put(`/users/${id}/roles`, { roles });
  return response.data.result as User;
};

export const resetUserPassword = async (id: string, password: string) => {
  const response = await axiosInstance.put(`/users/${id}/reset-password`, { password });
  return response.data.result as User;
};

export const activateUser = async (id: string) => {
  const response = await axiosInstance.put(`/users/${id}/activate`);
  return response.data.result as User;
};

export const getRoles = async () => {
  const response = await axiosInstance.get('/roles');
  return response.data.result as Role[];
};

export const getPermissions = async () => {
  const response = await axiosInstance.get('/permissions');
  return response.data.result as Permission[];
};
