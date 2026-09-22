import api from '@/lib/api';
import { ChickenYield } from '../types';

export interface GetChickenYieldsQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const chickenYieldsService = {
  getChickenYields: async (query?: GetChickenYieldsQuery): Promise<PaginatedResponse<ChickenYield>> => {
    const response = await api.get<PaginatedResponse<ChickenYield>>('/api/v1/master-data/chicken-yields', { params: query });
    return response.data;
  },

  getChickenYieldById: async (id: number): Promise<ChickenYield> => {
    const response = await api.get<ChickenYield>(`/api/v1/master-data/chicken-yields/${id}`);
    return response.data;
  },

  createChickenYield: async (data: any): Promise<ChickenYield> => {
    const response = await api.post<ChickenYield>('/api/v1/master-data/chicken-yields', data);
    return response.data;
  },

  updateChickenYield: async (id: number, data: any): Promise<ChickenYield> => {
    const response = await api.put<ChickenYield>(`/api/v1/master-data/chicken-yields/${id}`, data);
    return response.data;
  },

  updateChickenYieldStatus: async (id: number, status: string): Promise<ChickenYield> => {
    const response = await api.patch<ChickenYield>(`/api/v1/master-data/chicken-yields/${id}/status`, { status });
    return response.data;
  },

  deleteChickenYield: async (id: number): Promise<void> => {
    await api.delete(`/api/v1/master-data/chicken-yields/${id}`);
  },
};
