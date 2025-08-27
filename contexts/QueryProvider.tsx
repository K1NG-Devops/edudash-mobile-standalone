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
focusManager.setEventListener((handleFocus) => {
  if (typeof window === 'undefined') {
    return () => {}
  }
  const sub = AppState.addEventListener('change', (state) => {
    handleFocus(state === 'active')
  })
  return () => sub.remove()
})

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
  const [persister, setPersister] = React.useState<Persister | null>(null)

  // Initialize persistence only in safe runtime environments
  React.useEffect(() => {
    let p: Persister | null = null
    if (Platform.OS === 'web') {
      // Avoid SSR: window is undefined during build/server
      if (typeof window !== 'undefined' && window?.localStorage) {
        p = createSyncStoragePersister({
          storage: window.localStorage,
          key: 'edudash-react-query-cache',
          throttleTime: 1000,
        })
      }
    } else {
      p = createAsyncStoragePersister({
        storage: AsyncStorage,
        key: 'edudash-react-query-cache',
        throttleTime: 1000,
      })
    }

    if (p) {
      setPersister(p)
      // Attach persistence to the client
      persistQueryClient({
        queryClient: client,
        persister: p,
        buster: 'v1',
        maxAge: 1000 * 60 * 60 * 24, // 24h
      })
    }
  }, [client])

  if (persister) {
    return (
      <PersistQueryClientProvider client={client} persistOptions={{ persister }}>
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      </PersistQueryClientProvider>
    )
  }

  // Fallback: no persistence (e.g., SSR / build step)
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

