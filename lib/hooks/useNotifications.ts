import { useEffect } from 'react';
import { useAuth } from '@/contexts/SimpleWorkingAuth';
import { notificationService } from '@/lib/services/notificationService';

export const useNotifications = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      // Initialize with your OneSignal App ID
      notificationService.initialize(
        process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID || '', 
        user.id
      );
    }
  }, [user?.id]);

  return {
    sendEventInvitation: notificationService.sendEventInvitation.bind(notificationService),
    sendGroupInvitation: notificationService.sendGroupInvitation.bind(notificationService),
    sendEventReminder: notificationService.sendEventReminder.bind(notificationService),
    sendApprovalRequest: notificationService.sendApprovalRequest.bind(notificationService),
    sendApprovalResponse: notificationService.sendApprovalResponse.bind(notificationService),
  };
};
