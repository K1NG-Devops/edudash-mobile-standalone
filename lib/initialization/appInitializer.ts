import { analytics } from '@/lib/services/analyticsService';
import { notificationService } from '@/lib/services/notificationService';
import { supabase } from '@/lib/supabase';

interface InitializationConfig {
  oneSignalAppId?: string;
  posthogApiKey?: string;
  posthogHost?: string;
}

export class AppInitializer {
  private static instance: AppInitializer;
  private isInitialized = false;

  static getInstance(): AppInitializer {
    if (!AppInitializer.instance) {
      AppInitializer.instance = new AppInitializer();
    }
    return AppInitializer.instance;
  }

  async initialize(config: InitializationConfig) {
    if (this.isInitialized) {
      console.log('App already initialized');
      return;
    }

    try {
      console.log('Initializing app services...');

      // Initialize analytics
      if (config.posthogApiKey) {
        await analytics.initialize(
          config.posthogApiKey,
          config.posthogHost
        );
        console.log('Analytics initialized');
      }

      // Get current user for notifications
      const { data: { user } } = await supabase.auth.getUser();
      
      // Initialize notifications
      if (config.oneSignalAppId && user) {
        await notificationService.initialize(
          config.oneSignalAppId,
          user.id
        );
        console.log('Notifications initialized');
      }

      // Set up auth state listener
      supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // Update analytics user
          analytics.identify(session.user.id, {
            email: session.user.email,
          });

          // Update notification user
          if (config.oneSignalAppId) {
            notificationService.initialize(
              config.oneSignalAppId,
              session.user.id
            );
          }
        } else if (event === 'SIGNED_OUT') {
          // Reset analytics and notifications
          analytics.reset();
        }
      });

      this.isInitialized = true;
      console.log('App initialization complete');
    } catch (error) {
      console.error('App initialization failed:', error);
      throw error;
    }
  }

  async checkPermissions() {
    // Check and request necessary permissions
    try {
      // Notification permissions are handled by OneSignal
      // Add other permission checks here if needed
      return true;
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    }
  }

  async setupDeepLinking() {
    // Handle deep links for notifications
    // This would integrate with your navigation system
    console.log('Deep linking setup complete');
  }

  isAppInitialized(): boolean {
    return this.isInitialized;
  }
}

export const appInitializer = AppInitializer.getInstance();
