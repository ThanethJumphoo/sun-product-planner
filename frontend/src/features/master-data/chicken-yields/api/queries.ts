import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { chickenYieldsService, GetChickenYieldsQuery, PaginatedResponse } from './chicken-yields.service';
import { ChickenYield } from '../types';

export const chickenYieldKeys = {
  all: ['chicken-yields'] as const,
  lists: () => [...chickenYieldKeys.all, 'list'] as const,
  list: (filters: GetChickenYieldsQuery) => [...chickenYieldKeys.lists(), { filters }] as const,
  details: () => [...chickenYieldKeys.all, 'detail'] as const,
  detail: (id: number) => [...chickenYieldKeys.details(), id] as const,
};

export function useChickenYields(query?: GetChickenYieldsQuery, options?: Omit<UseQueryOptions<PaginatedResponse<ChickenYield>, Error>, 'queryKey' | 'queryFn'>) {
  return useQuery<PaginatedResponse<ChickenYield>, Error>({
    queryKey: chickenYieldKeys.list(query || {}),
    queryFn: () => chickenYieldsService.getChickenYields(query),
    ...options,
  } as any);
}

export function useChickenYield(id: number, options?: Omit<UseQueryOptions<ChickenYield, Error>, 'queryKey' | 'queryFn'>) {
  return useQuery<ChickenYield, Error>({
    queryKey: chickenYieldKeys.detail(id),
    queryFn: () => chickenYieldsService.getChickenYieldById(id),
    enabled: !!id,
    ...options,
  } as any);
}
