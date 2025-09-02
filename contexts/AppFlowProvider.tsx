import React, { createContext, useContext, useMemo } from 'react'
import { useAuth } from '@/contexts/SimpleWorkingAuth'
import { useMachine } from '@xstate/react'
import { appFlowMachine, AppRole } from '@/lib/state/appFlow.machine'

const AppFlowContext = createContext<{ state: string; role: AppRole }>({ state: 'guest', role: 'guest' })

export const AppFlowProvider = ({ children }: { children: React.ReactNode }) => {
  const { profile } = useAuth()
  const role: AppRole = useMemo(() => {
    const r = String(profile?.role || '').toLowerCase()
    if (r === 'superadmin') return 'superadmin'
    if (r === 'principal' || r === 'preschool_admin') return 'principal'
    if (r === 'teacher') return 'teacher'
    if (r === 'parent') return 'parent'
    return 'guest'
  }, [profile?.role])

  const [state] = useMachine(appFlowMachine.provide({
    guards: {},
  }), { input: { role } })

  const value = useMemo(() => ({ state: state.value as string, role }), [state.value, role])

  return (
    <AppFlowContext.Provider value={value}>{children}</AppFlowContext.Provider>
  )
}

export const useAppFlow = () => useContext(AppFlowContext)

