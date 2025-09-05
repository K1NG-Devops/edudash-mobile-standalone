// Group Management Components
export { GroupCard } from './GroupCard';
export { GroupMemberList } from './GroupMemberList';
export { CreateGroupModal } from './CreateGroupModal';
export { GroupManagementDashboard } from './GroupManagementDashboard';

// Event Targeting Components
export { EventTargetingSelector } from '../events/EventTargetingSelector';
export { EventInvitationCard } from '../events/EventInvitationCard';
export { JoinEventModal } from '../events/JoinEventModal';

// Export enhanced CreateEventModal
export { default as CreateEventModal } from '../events/CreateEventModal';

// Re-export types for convenience
export type {
  PrincipalGroup,
  GroupMember,
  GroupMemberRole,
  CreateGroupRequest,
  EventTargetingConfig,
  EventAudienceType,
  EventInvitation,
  EventVisibilityInfo,
} from '@/types/groups';
