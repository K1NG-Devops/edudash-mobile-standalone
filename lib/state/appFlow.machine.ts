import { createMachine } from 'xstate'

export type AppRole = 'superadmin' | 'principal' | 'teacher' | 'parent' | 'guest'

export const appFlowMachine = createMachine({
  id: 'appFlow',
  initial: 'deciding',
  context: { role: 'guest' as AppRole },
  states: {
    deciding: {
      always: [
        { target: 'superadmin', guard: (ctx) => ctx.role === 'superadmin' },
        { target: 'principal', guard: (ctx) => ctx.role === 'principal' },
        { target: 'teacher', guard: (ctx) => ctx.role === 'teacher' },
        { target: 'parent', guard: (ctx) => ctx.role === 'parent' },
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

