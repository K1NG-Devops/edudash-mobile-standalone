import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

export type MessageRow = Database['public']['Tables']['messages']['Row']

const MESSAGES_LIMIT = 200

export const messagesKey = (
  conversationId: string,
  preschoolId?: string,
  role?: string
) => ['conversationMessages', conversationId, preschoolId ?? 'na', role ?? 'na'] as const

export function useConversationMessages(
  conversationId?: string,
  preschoolId?: string,
  role?: string
) {
  return useQuery({
    enabled: !!conversationId,
    queryKey: conversationId ? messagesKey(conversationId, preschoolId, role) : ['conversationMessages', 'noop'],
    queryFn: async (): Promise<MessageRow[]> => {
      if (!conversationId) return []
      let q = supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(MESSAGES_LIMIT)

      if (preschoolId) {
        // Maintain tenant guard if schema has preschool_id on messages
        q = q.eq('preschool_id', preschoolId as any)
      }

      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as MessageRow[]
    },
    staleTime: 15_000,
  })
}

