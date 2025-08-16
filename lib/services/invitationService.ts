import { supabase } from '../supabase';

export interface CreateInvitationParams {
  email: string;
  role: 'teacher' | 'parent';
  preschool_id: string;
}

export interface InvitationCode {
  id: string;
  code: string;
  email: string;
  role: string;
  preschool_id: string;
  invited_by: string;
  expires_at: string;
  used_at?: string;
  used_by?: string;
  created_at: string;
}

export class InvitationService {
  /**
   * Generate a random invitation code
   */
  private static generateInvitationCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate an invitation code for a teacher or parent
   * For now, we'll use localStorage storage until the invitation_codes table is set up
   */
  static async createInvitation(params: CreateInvitationParams): Promise<string> {
    try {
      // Generate a simple invitation code
      const invitationCode = this.generateInvitationCode();
      
      // Store invitation details in localStorage for now
      // TODO: Replace with database storage once invitation_codes table is created
      const invitation = {
        id: crypto.randomUUID(),
        code: invitationCode,
        email: params.email,
        role: params.role,
        preschool_id: params.preschool_id,
        invited_by: (await supabase.auth.getUser()).data.user?.id || '',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        created_at: new Date().toISOString()
      };

      // Store in localStorage temporarily
      if (typeof window !== 'undefined') {
        const existingInvitations = JSON.parse(localStorage.getItem('pendingInvitations') || '[]');
        existingInvitations.push(invitation);
        localStorage.setItem('pendingInvitations', JSON.stringify(existingInvitations));
      }

      // Send invitation email
      await this.sendInvitationEmail(params.email, invitationCode, params.role);

      return invitationCode;
    } catch (error) {
      console.error('Error in createInvitation:', error);
      throw error;
    }
  }

  /**
   * Use an invitation code to create a user account
   * For now, we'll use localStorage until database is set up
   */
  static async useInvitationCode(
    code: string,
    authUserId: string,
    name: string,
    phone?: string
  ): Promise<string> {
    try {
      // Get invitation from localStorage
      if (typeof window === 'undefined') {
        throw new Error('Local storage not available');
      }

      const existingInvitations = JSON.parse(localStorage.getItem('pendingInvitations') || '[]');
      const invitation = existingInvitations.find((inv: InvitationCode) => 
        inv.code === code && !inv.used_at && new Date(inv.expires_at) > new Date()
      );

      if (!invitation) {
        throw new Error('Invalid or expired invitation code');
      }

      // Create user in database
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          auth_user_id: authUserId,
          email: invitation.email,
          name,
          phone: phone || null,
          role: invitation.role,
          preschool_id: invitation.preschool_id,
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating user:', error);
        throw new Error(error.message || 'Failed to create user');
      }

      // Mark invitation as used
      invitation.used_at = new Date().toISOString();
      invitation.used_by = authUserId;
      localStorage.setItem('pendingInvitations', JSON.stringify(existingInvitations));

      return newUser.id;
    } catch (error) {
      console.error('Error in useInvitationCode:', error);
      throw error;
    }
  }

  /**
   * Get invitation details by code
   */
  static async getInvitationByCode(code: string): Promise<InvitationCode | null> {
    try {
      if (typeof window === 'undefined') {
        return null;
      }

      const existingInvitations = JSON.parse(localStorage.getItem('pendingInvitations') || '[]');
      const invitation = existingInvitations.find((inv: InvitationCode) => 
        inv.code === code && !inv.used_at && new Date(inv.expires_at) > new Date()
      );

      return invitation || null;
    } catch (error) {
      console.error('Error in getInvitationByCode:', error);
      throw error;
    }
  }

  /**
   * Get all invitations for a preschool (for admins)
   */
  static async getPreschoolInvitations(preschoolId: string): Promise<InvitationCode[]> {
    try {
      if (typeof window === 'undefined') {
        return [];
      }

      const existingInvitations = JSON.parse(localStorage.getItem('pendingInvitations') || '[]');
      return existingInvitations.filter((inv: InvitationCode) => inv.preschool_id === preschoolId);
    } catch (error) {
      console.error('Error in getPreschoolInvitations:', error);
      throw error;
    }
  }

  /**
   * Send invitation email (placeholder - integrate with your email service)
   */
  private static async sendInvitationEmail(
    email: string,
    invitationCode: string,
    role: string
  ): Promise<void> {
    try {
      // TODO: Integrate with your email service (SendGrid, AWS SES, etc.)

      // For now, we'll use a simple notification
      // Replace this with actual email sending logic
      if (typeof window !== 'undefined') {
        alert(`Invitation sent to ${email}!\nCode: ${invitationCode}\nRole: ${role}`);
      }

      // Example email service integration:
      /*
      const emailResponse = await fetch('/api/send-invitation-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          invitationCode,
          role,
          signupUrl: `${process.env.EXPO_PUBLIC_WEB_URL}/signup?code=${invitationCode}`
        })
      });

      if (!emailResponse.ok) {
        throw new Error('Failed to send invitation email');
      }
      */
    } catch (error) {
      console.error('Error sending invitation email:', error);
      // Don't throw here - invitation was created successfully, just email failed
    }
  }

  /**
   * Resend an invitation email
   */
  static async resendInvitation(invitationId: string): Promise<void> {
    try {
      if (typeof window === 'undefined') {
        throw new Error('Local storage not available');
      }

      const existingInvitations = JSON.parse(localStorage.getItem('pendingInvitations') || '[]');
      const invitation = existingInvitations.find((inv: InvitationCode) => 
        inv.id === invitationId && !inv.used_at && new Date(inv.expires_at) > new Date()
      );

      if (!invitation) {
        throw new Error('Invitation not found or expired');
      }

      await this.sendInvitationEmail(
        invitation.email,
        invitation.code,
        invitation.role
      );
    } catch (error) {
      console.error('Error resending invitation:', error);
      throw error;
    }
  }

  /**
   * Cancel/delete an invitation
   */
  static async cancelInvitation(invitationId: string): Promise<void> {
    try {
      if (typeof window === 'undefined') {
        throw new Error('Local storage not available');
      }

      const existingInvitations = JSON.parse(localStorage.getItem('pendingInvitations') || '[]');
      const filteredInvitations = existingInvitations.filter((inv: InvitationCode) => inv.id !== invitationId);
      localStorage.setItem('pendingInvitations', JSON.stringify(filteredInvitations));
    } catch (error) {
      console.error('Error in cancelInvitation:', error);
      throw error;
    }
  }
}
