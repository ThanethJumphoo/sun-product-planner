import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import api from '@/lib/api';

export function useDpsData(partName: string, currentDay: Date) {
  const dateString = format(currentDay, 'yyyy-MM-dd');

  // Fetch Supplies
  const { data: supplies = [], isLoading: isLoadingSupplies, refetch: refetchSupplies } = useQuery({
    queryKey: ['dps', partName, 'supplies', dateString],
    queryFn: async () => {
      const res = await api.get(`/api/v1/dps/${partName}/supplies`, {
        params: { date: dateString }
      });
      return res.data || [];
    }
  });

  // Fetch Orders
  const { data: orders = [], isLoading: isLoadingOrders, refetch: refetchOrders } = useQuery({
    queryKey: ['dps', partName, 'orders', dateString],
    queryFn: async () => {
      const res = await api.get(`/api/v1/dps/${partName}/orders`, {
        params: { date: dateString }
      });
      return res.data || [];
    }
  });

  // Fetch Weight Distribution
  const { data: wdMatrix = [], isLoading: isLoadingWd } = useQuery({
    queryKey: ['weight-distribution', partName],
    queryFn: async () => {
      const res = await api.get(`/api/v1/weight-distribution`, {
        params: { partName }
      });
      return res.data || [];
    }
  });

  // Fetch RM Transfers
  const { data: transfers = [], isLoading: isLoadingTransfers, refetch: refetchTransfers } = useQuery({
    queryKey: ['dps', partName, 'transfers', dateString],
    queryFn: async () => {
      const res = await api.get(`/api/v1/dps/${partName}/transfers`, {
        params: { date: dateString }
      });
      return res.data || [];
    }
  });

  // Fetch Product Specs for all unique items in orders
  const uniqueItemCodes = Array.from(new Set(orders.map((d: any) => d.itemCode))) as string[];
  
  const { data: specs = {}, isLoading: isLoadingSpecs } = useQuery({
    queryKey: ['product-specs', uniqueItemCodes],
    queryFn: async () => {
      if (uniqueItemCodes.length === 0) return {};
      
      const specPromises = uniqueItemCodes.map(code => 
        api.get(`/api/v1/product-spec/${code}`).catch(() => ({ data: null }))
      );
      const specResponses = await Promise.all(specPromises);
      
      const specMap: Record<string, any> = {};
      specResponses.forEach((res, index) => {
        if (res.data) {
          specMap[uniqueItemCodes[index]] = res.data;
        }
      });
      return specMap;
    },
    enabled: uniqueItemCodes.length > 0
  });

  const isLoading = isLoadingSupplies || isLoadingOrders || isLoadingWd || isLoadingTransfers || isLoadingSpecs;

  const refetchAll = () => {
    refetchSupplies();
    refetchOrders();
    refetchTransfers();
  };

  return {
    supplies,
    orders,
    wdMatrix,
    transfers,
    specs,
    isLoading,
    refetchAll
  };
}
