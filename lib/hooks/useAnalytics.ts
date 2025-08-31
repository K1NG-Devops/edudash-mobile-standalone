import { useEffect } from 'react';
import { useAuth } from '@/contexts/SimpleWorkingAuth';
import { analytics } from '@/lib/services/analyticsService';

export const useAnalytics = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      analytics.identify(user.id, {
        name: user.name,
        email: user.email,
        role: user.role,
        preschool_id: user.preschool_id,
      });
    }
  }, [user]);

  return analytics;
};

// Screen tracking hook
export const useScreenTracking = (screenName: string, properties?: Record<string, any>) => {
  const analytics = useAnalytics();

  useEffect(() => {
    analytics.trackScreenView(screenName, properties);
  }, [screenName]);
};
