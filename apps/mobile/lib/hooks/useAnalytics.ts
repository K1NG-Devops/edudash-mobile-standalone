import { useEffect } from 'react';
import { useAuth } from '@/contexts/SimpleWorkingAuth';
import { analytics } from '@/lib/services/analyticsService';

export const useAnalytics = () => {
  const { profile } = useAuth();

  useEffect(() => {
    if (profile?.auth_user_id) {
      analytics.identify(profile.auth_user_id, {
        name: profile.name,
        email: profile.email,
        role: profile.role,
        preschool_id: profile.preschool_id ?? undefined,
      });
    }
  }, [profile]);

  return analytics;
};

// Screen tracking hook
export const useScreenTracking = (screenName: string, properties?: Record<string, any>) => {
  const analytics = useAnalytics();

  useEffect(() => {
    analytics.trackScreenView(screenName, properties);
  }, [screenName]);
};
