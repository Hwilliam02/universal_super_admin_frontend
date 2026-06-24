import { api } from './axiosConfig';
import type { ApiResponse, User,  GlobalUser } from '@/types';

export interface CreateSuperAdminData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: string[];
}

// Create super admin
export const createSuperAdmin = async (data: CreateSuperAdminData): Promise<ApiResponse<User>> => {
  const response = await api.post('/auth/create-super-admin', data);
  return response.data;
};

// Get all tenants/companies (for super admin) or company users (for admin)


// Get users by company ID
// export const getCompanyUsers = async (companyId: string): Promise<ApiResponse<User[]>> => {
//   const response = await api.get(`/users/company/${companyId}`);
//   return response.data;
// };

// Update user status
export const updateUserStatus = async (userId: string, status: 'active' | 'inactive' | 'suspended'): Promise<ApiResponse<User>> => {
  const response = await api.patch(`/users/${userId}/status`, { status });
  return response.data;
};

export const restoreUser = async (userId: string): Promise<ApiResponse<User>> => {
  const response = await api.patch(`/users/undelete/${userId}`);
  return response.data;
};

export const getGlobalUsers = async (): Promise<ApiResponse<GlobalUser[]>> => {
  const response = await api.get('/global-users');
  return response.data;
};

export const updateGlobalUserStatus = async (globalUserId: string, status: 'Active' | 'Suspended'): Promise<ApiResponse<GlobalUser>> => {
  const response = await api.patch(`/global-users/${globalUserId}/status`, { status });
  return response.data;
};

export const assignUserToCompany = async (globalUserId: string, companyId: string): Promise<ApiResponse<any>> => {
  const response = await api.patch(`/global-users/${globalUserId}/assign-company`, { companyId });
  return response.data;
};

export const updateUserVisa = async (globalUserId: string, productId: string, role: string): Promise<ApiResponse<any>> => {
  const response = await api.patch(`/global-users/${globalUserId}/visas`, { productId, role });
  return response.data;
};

export const adminChangePassword = async (targetEmail: string, newPassword: string): Promise<ApiResponse<any>> => {
  const response = await api.post('/universal-auth/admin-change-password', { target_email: targetEmail, new_password: newPassword });
  return response.data;
};

export const userApi = {
  createSuperAdmin,
  // getCompanyUsers,
  updateUserStatus,
  restoreUser,
  getGlobalUsers,
  updateGlobalUserStatus,
  assignUserToCompany,
  updateUserVisa,
  adminChangePassword,
};

export default userApi;
