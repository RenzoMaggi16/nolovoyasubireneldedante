import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateOrderStatus as updateStatusService } from '../services/ordersService';
import { useOrdersStore } from '../store/ordersStore';
import { OrderStatus, PlatformId } from '../types/orders';

export function useOrderActions() {
  const queryClient = useQueryClient();
  const updateLocalStatus = useOrdersStore((state) => state.updateOrderStatus);

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status, platform }: { orderId: string; status: OrderStatus; platform: PlatformId }) =>
      updateStatusService(orderId, status, platform),
    onMutate: async ({ orderId, status, platform }) => {
      // Optimistic update
      updateLocalStatus(orderId, platform, status);
    },
    onSuccess: (_, { platform }) => {
      queryClient.invalidateQueries({ queryKey: ['orders', platform] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'all'] });
    },
  });

  return {
    updateStatus: updateStatusMutation.mutate,
    isUpdating: updateStatusMutation.isPending,
  };
}
