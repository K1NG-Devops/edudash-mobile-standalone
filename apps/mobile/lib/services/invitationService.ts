// Deprecated mock invitation service. All invitation redemption must use
// the Supabase Edge Function 'redeem-invitation'. These methods intentionally
// throw if called to avoid accidental reliance on local mock state.

export class InvitationService {
  static async createInvitation(): Promise<string> {
    throw new Error('InvitationService (mock) is deprecated. Use server-side invitation flows.');
  }
  static async useInvitationCode(): Promise<string> {
    throw new Error('InvitationService (mock) is deprecated. Use redeem-invitation Edge Function.');
  }
  static async getInvitationByCode(): Promise<null> {
    throw new Error('InvitationService (mock) is deprecated.');
  }
  static async getPreschoolInvitations(): Promise<[]> {
    throw new Error('InvitationService (mock) is deprecated.');
  }
}

