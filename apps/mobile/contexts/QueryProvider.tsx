import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PersistQueryClientProvider, persistQueryClient } from '@tanstack/react-query-persist-client'
import type { Persister } from '@tanstack/query-persist-client-core'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { AppState, Platform } from 'react-native'
import { focusManager, onlineManager } from '@tanstack/react-query'

// Basic online manager hookup (best-effort)
onlineManager.setOnline(true)

// App focus integration for React Query (pause/resume refetches)
// Guard against SSR / non-window environments
if (Platform.OS !== 'web') {
  focusManager.setEventListener((handleFocus) => {
    const sub = AppState.addEventListener('change', (state) => {
      handleFocus(state === 'active')
    })
    return () => sub.remove()
  })
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30s
      gcTime: 1000 * 60 * 10, // 10m
      retry: (failureCount, error: any) => {
        if (Platform.OS === 'web') return failureCount < 2
        return failureCount < 3
      },
      refetchOnMount: false,
      refetchOnReconnect: true,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 1,
    },
  },
})

export const QueryProvider = ({ children }: { children: React.ReactNode }) => {
  const [client] = React.useState(() => queryClient)
  
  // Temporarily disable persistence to fix mobile issues
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

