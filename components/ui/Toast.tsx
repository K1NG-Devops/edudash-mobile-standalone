import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { Animated, Platform, StyleSheet, Text, View } from 'react-native'
import { shadow } from '@/lib/ui/shadow'

export type ToastType = 'success' | 'error' | 'info'

interface ToastState {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  show: (message: string, type?: ToastType, durationMs?: number) => void
  success: (message: string, durationMs?: number) => void
  error: (message: string, durationMs?: number) => void
  info: (message: string, durationMs?: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastState | null>(null)
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(-10)).current
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const idRef = useRef(0)

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -10, duration: 180, useNativeDriver: true }),
    ]).start(() => setToast(null))
  }, [opacity, translateY])

  const showBase = useCallback((message: string, type: ToastType = 'info', durationMs = 2400) => {
    if (!message) return
    idRef.current += 1
    const id = idRef.current
    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setToast({ id, message, type })
    opacity.setValue(0)
    translateY.setValue(-10)

    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 160, useNativeDriver: true }),
    ]).start(() => {
      timerRef.current = setTimeout(() => {
        if (id === idRef.current) hide()
      }, durationMs)
    })
  }, [hide, opacity, translateY])

  const value = useMemo<ToastContextValue>(() => ({
    show: (m, t = 'info', d) => showBase(m, t, d),
    success: (m, d) => showBase(m, 'success', d),
    error: (m, d) => showBase(m, 'error', d),
    info: (m, d) => showBase(m, 'info', d),
  }), [showBase])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toast,
            toast.type === 'success' ? styles.success : toast.type === 'error' ? styles.error : styles.info,
            { opacity, transform: [{ translateY }] },
          ]}
        >
          <Text style={styles.text}>{toast.message}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  )
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 70 : 50,
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    ...shadow(3),
  } as any,
  success: {
    backgroundColor: 'rgba(34,197,94,0.95)', // green-500
  },
  error: {
    backgroundColor: 'rgba(239,68,68,0.95)', // red-500
  },
  info: {
    backgroundColor: 'rgba(59,130,246,0.95)', // blue-500
  },
  text: {
    color: '#000',
    fontWeight: '800',
    letterSpacing: 0.3,
  },
})

