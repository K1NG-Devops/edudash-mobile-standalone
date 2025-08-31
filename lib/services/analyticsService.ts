import PostHog from 'posthog-react-native';

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
}

export class AnalyticsService {
  private static instance: AnalyticsService;
  private posthog: PostHog | null = null;
  private userId: string | null = null;

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  async initialize(apiKey: string, host?: string) {
    this.posthog = new PostHog(apiKey, {
      host: host || 'https://app.posthog.com',
    });
  }

  identify(userId: string, properties?: Record<string, any>) {
    this.userId = userId;
    this.posthog?.identify(userId, properties);
  }

  track(event: AnalyticsEvent) {
    if (!this.posthog) {
      console.warn('Analytics not initialized');
      return;
    }

    this.posthog.capture(event.name, {
      ...event.properties,
      timestamp: new Date().toISOString(),
    });
  }

  // Group Management Events
  trackGroupCreated(groupId: string, groupType: string) {
    this.track({
      name: 'group_created',
      properties: {
        group_id: groupId,
        group_type: groupType,
      },
    });
  }

  trackGroupJoined(groupId: string, role: string) {
    this.track({
      name: 'group_joined',
      properties: {
        group_id: groupId,
        member_role: role,
      },
    });
  }

  trackGroupLeft(groupId: string) {
    this.track({
      name: 'group_left',
      properties: { group_id: groupId },
    });
  }

  trackMemberInvited(groupId: string, inviteeId: string) {
    this.track({
      name: 'member_invited',
      properties: {
        group_id: groupId,
        invitee_id: inviteeId,
      },
    });
  }

  // Event Management Events
  trackEventCreated(eventId: string, audienceType: string, requiresApproval: boolean) {
    this.track({
      name: 'event_created',
      properties: {
        event_id: eventId,
        audience_type: audienceType,
        requires_approval: requiresApproval,
      },
    });
  }

  trackEventJoined(eventId: string, joinMethod: 'direct' | 'invitation' | 'approval') {
    this.track({
      name: 'event_joined',
      properties: {
        event_id: eventId,
        join_method: joinMethod,
      },
    });
  }

  trackInvitationResponse(invitationId: string, response: string) {
    this.track({
      name: 'invitation_responded',
      properties: {
        invitation_id: invitationId,
        response: response,
      },
    });
  }

  trackApprovalRequest(eventId: string) {
    this.track({
      name: 'approval_requested',
      properties: { event_id: eventId },
    });
  }

  trackApprovalResponse(eventId: string, approved: boolean) {
    this.track({
      name: 'approval_responded',
      properties: {
        event_id: eventId,
        approved: approved,
      },
    });
  }

  // Feature Usage
  trackFeatureUsed(feature: string, metadata?: Record<string, any>) {
    this.track({
      name: 'feature_used',
      properties: {
        feature_name: feature,
        ...metadata,
      },
    });
  }

  // Screen Views
  trackScreenView(screenName: string, properties?: Record<string, any>) {
    this.track({
      name: 'screen_viewed',
      properties: {
        screen_name: screenName,
        ...properties,
      },
    });
  }

  // Error Tracking
  trackError(error: string, context?: Record<string, any>) {
    this.track({
      name: 'error_occurred',
      properties: {
        error_message: error,
        ...context,
      },
    });
  }

  reset() {
    this.userId = null;
    this.posthog?.reset();
  }
}

export const analytics = AnalyticsService.getInstance();
