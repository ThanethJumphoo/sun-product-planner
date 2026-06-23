import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { usersService, GetUsersQuery } from './users.service';
import { userQueryKeys } from './query-keys';
import { User, UsersPaginatedResponse } from '../types';
import { AppError } from '../../../../utils/api-error';

export const useUsers = (
  query: GetUsersQuery,
  options?: Omit<UseQueryOptions<UsersPaginatedResponse, AppError>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<UsersPaginatedResponse, AppError>({
    queryKey: userQueryKeys.list(query),
    queryFn: () => usersService.getUsers(query),
    ...options,
  } as any);
};

export const useUser = (
  id: number,
  options?: Omit<UseQueryOptions<User, AppError>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<User, AppError>({
    queryKey: userQueryKeys.detail(id),
    queryFn: () => usersService.getUserById(id),
    enabled: !!id,
    ...options,
  } as any);
};
