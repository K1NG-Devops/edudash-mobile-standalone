import { supabase } from '@/lib/supabase';

export interface BillingPreferences {
  user_id: string;
  overage_enabled: boolean;
  overage_price_per_unit: number;
  created_at?: string;
  updated_at?: string;
}

export class BillingPreferencesService {
  static async getUserIdByAuth(authUserId: string): Promise<string | null> {
    const { data, error } = await (supabase as any)
      .from('users')
      .select('id')
      .eq('auth_user_id', authUserId)
      .maybeSingle();
    if (error) return null;
    return data?.id ?? null;
  }

  static async getPreferencesByAuth(authUserId: string): Promise<BillingPreferences | null> {
    const userId = await this.getUserIdByAuth(authUserId);
    if (!userId) return null;
    const { data } = await (supabase as any)
      .from('billing_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    return data ?? null;
  }

  static async setOverageEnabledByAuth(authUserId: string, enabled: boolean, pricePerUnit?: number): Promise<boolean> {
    const userId = await this.getUserIdByAuth(authUserId);
    if (!userId) return false;
    const payload: Partial<BillingPreferences> = {
      user_id: userId,
      overage_enabled: enabled,
    } as any;
    if (typeof pricePerUnit === 'number') (payload as any).overage_price_per_unit = pricePerUnit;
    const { error } = await (supabase as any)
      .from('billing_preferences')
      .upsert(payload, { onConflict: 'user_id' });
    return !error;
  }

  static async getMonthlyOverageByAuth(authUserId: string): Promise<{ units: number; amount: number }> {
    const userId = await this.getUserIdByAuth(authUserId);
    if (!userId) return { units: 0, amount: 0 };
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const { data } = await (supabase as any)
      .from('ai_overage_logs')
      .select('units, amount')
      .eq('user_id', userId)
      .gte('created_at', start);
    const units = (data || []).reduce((sum: number, r: any) => sum + (Number(r.units) || 0), 0);
    const amount = (data || []).reduce((sum: number, r: any) => sum + (Number(r.amount) || 0), 0);
    return { units, amount };
  }
}

