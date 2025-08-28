import { supabase } from '@/lib/supabase'
import { Platform } from 'react-native'

export type PushPlatform = 'ios' | 'android'

export const PushService = {
  async saveExpoPushToken(params: {
    token: string
    platform?: PushPlatform
    projectId?: string | null
    appVersion?: string | null
  }) {
    try {
      const { token, platform, projectId, appVersion } = params
      if (!token) return { error: 'Missing token' }

      // Resolve current user id from auth
      const { data: auth } = await supabase.auth.getUser()
      const authId = auth?.user?.id
      if (!authId) return { error: 'No authenticated user' }

      const { data: me } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', authId)
        .maybeSingle()
      const userId = me?.id
      if (!userId) return { error: 'User profile not found' }

      const devicePlatform: PushPlatform = platform || (Platform.OS === 'ios' ? 'ios' : 'android')

      const { error } = await supabase
        .from('push_device_tokens')
        .upsert(
          {
            user_id: userId,
            expo_push_token: token,
            platform: devicePlatform,
            project_id: projectId || null,
            app_version: appVersion || null,
            last_seen_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,expo_push_token' }
        )

      if (error) return { error: error.message }
      return { ok: true }
    } catch (e: any) {
      return { error: e?.message || 'Failed to save push token' }
    }
  },
}

