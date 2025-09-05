import { useEffect } from 'react';
import { useAuth } from '@/contexts/SimpleWorkingAuth';

// Minimal notifications hook to avoid type errors when the notification service is unavailable.
// These functions are no-ops for now and can be wired to a concrete implementation later.
export const useNotifications = () => {
  const { user } = useAuth();

  useEffect(() => {
    // No-op initialization placeholder
  }, [user?.id]);

  return {
    sendEventInvitation: async (..._args: any[]) => {},
    sendGroupInvitation: async (..._args: any[]) => {},
    sendEventReminder: async (..._args: any[]) => {},
    sendApprovalRequest: async (..._args: any[]) => {},
    sendApprovalResponse: async (..._args: any[]) => {},
  };
};
