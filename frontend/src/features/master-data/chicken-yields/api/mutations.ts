import { useMutation, useQueryClient } from '@tanstack/react-query';
import { chickenYieldsService } from './chicken-yields.service';
import { chickenYieldKeys } from './queries';
import { ChickenYieldFormValues } from '../schemas';

export function useCreateChickenYield() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ChickenYieldFormValues) => chickenYieldsService.createChickenYield(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chickenYieldKeys.lists() });
    },
  });
}

export function useUpdateChickenYield() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ChickenYieldFormValues> }) =>
      chickenYieldsService.updateChickenYield(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: chickenYieldKeys.lists() });
      queryClient.invalidateQueries({ queryKey: chickenYieldKeys.detail(variables.id) });
    },
  });
}

export function useUpdateChickenYieldStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      chickenYieldsService.updateChickenYieldStatus(id, status),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: chickenYieldKeys.lists() });
      queryClient.invalidateQueries({ queryKey: chickenYieldKeys.detail(variables.id) });
    },
  });
}

export function useDeleteChickenYield() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => chickenYieldsService.deleteChickenYield(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chickenYieldKeys.lists() });
    },
  });
}
