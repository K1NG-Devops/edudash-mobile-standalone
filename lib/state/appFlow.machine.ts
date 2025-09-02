import { createMachine } from 'xstate'

export type AppRole = 'superadmin' | 'principal' | 'teacher' | 'parent' | 'guest'

interface AppContext { role: AppRole }

export const appFlowMachine = createMachine({
  id: 'appFlow',
  types: {} as { context: AppContext; input: Partial<AppContext> },
  context: ({ input }) => ({ role: (input?.role as AppRole) ?? 'guest' }),
  initial: 'deciding',
  states: {
    deciding: {
      always: [
        { target: 'superadmin', guard: ({ context }) => context.role === 'superadmin' },
        { target: 'principal', guard: ({ context }) => context.role === 'principal' },
        { target: 'teacher', guard: ({ context }) => context.role === 'teacher' },
        { target: 'parent', guard: ({ context }) => context.role === 'parent' },
        { target: 'guest' },
      ],
    },
    superadmin: {},
    principal: {},
    teacher: {},
    parent: {},
    guest: {},
  },
})

