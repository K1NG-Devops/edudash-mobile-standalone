import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ConversationService } from '@/lib/services/conversationService'
import { messagesKey } from './useConversationMessages'
import type { Database } from '@/types/database'

export type MessageRow = Database['public']['Tables']['messages']['Row']

export function useConversationRealtime(opts: {
  conversationId?: string
  conversationType?: string // 'group' | 'announcement' | 'direct' | etc.
  preschoolId?: string
  role?: string
  autoScroll?: () => void
}) {
  const { conversationId, conversationType, preschoolId, role, autoScroll } = opts
  const qc = useQueryClient()

  useEffect(() => {
    if (!conversationId) return
    // Only wire realtime for group-like rooms (include announcements)
    if (conversationType !== 'group' && conversationType !== 'announcement') return

    const unsubscribe = ConversationService.subscribeToConversation(conversationId, {
      onInsert: (row: any) => {
        qc.setQueryData<MessageRow[]>(messagesKey(conversationId, preschoolId, role), (prev) => {
          const existing = prev ?? []
          if (existing.some((m) => m.id === row.id)) return existing
          const next = [...existing, row].slice(-200)
          return next
        })
        autoScroll?.()
      },
    })

    return () => unsubscribe()
  }, [conversationId, conversationType, preschoolId, role, qc, autoScroll])
}

