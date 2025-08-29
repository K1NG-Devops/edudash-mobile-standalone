import { useQuery } from '@tanstack/react-query'
import { SubscriptionService } from '@/lib/services/subscriptionService'

export function useBillingHistory(userId: string) {
  return useQuery({
    queryKey: ['billingHistory', userId],
    queryFn: async () => {
      if (!userId) return [] as Array<{ id: string; amount: number; currency: string; status: string; processed_at: string; provider_payment_id: string | null }>
      const res = await SubscriptionService.getRecentPayments(userId, 10)
      return res.data || []
    },
    enabled: !!userId,
    staleTime: 1000 * 60, // 1 minute
  })
}

