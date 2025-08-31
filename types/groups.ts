// Principal Groups and Event Targeting Types
import { EnhancedEvent } from './events';

export interface PrincipalGroup {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  preschool_id: string;
  group_type: 'custom' | 'department' | 'grade_level' | 'committee';
  color: string;
  icon: string;
  is_active: boolean;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
  
  // Computed fields
  member_count?: number;
  user_role?: GroupMemberRole;
  recent_activity?: ActivityFeedItem[];
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role_in_group: GroupMemberRole;
  joined_at: string;
  invited_by?: string;
  status: 'active' | 'pending' | 'inactive';
  permissions: Record<string, boolean>;
  created_at: string;
  updated_at: string;
  
  // Computed fields
  user?: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
    role: string;
  };
}

export type GroupMemberRole = 'admin' | 'moderator' | 'member';

export interface EventAudience {
  id: string;
  event_id: string;
  audience_type: 'role' | 'group' | 'user' | 'preschool';
  target_id?: string;
  target_value?: string;
  created_at: string;
}

export interface EventInvitation {
  id: string;
  event_id: string;
  inviter_id: string;
  invitee_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'maybe';
  response_message?: string;
  invited_at: string;
  responded_at?: string;
  reminder_count: number;
  last_reminder_at?: string;
  
  // Computed fields
  event?: Pick<EnhancedEvent, 'id' | 'title' | 'start_date' | 'event_type'>;
  inviter?: {
    id: string;
    name: string;
    avatar_url?: string;
    role: string;
  };
  invitee?: {
    id: string;
    name: string;
    avatar_url?: string;
    role: string;
  };
}

export interface GroupInvitation {
  id: string;
  group_id: string;
  inviter_id: string;
  invitee_id: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined';
  invited_at: string;
  responded_at?: string;
  expires_at: string;
  
  // Computed fields
  group?: Pick<PrincipalGroup, 'id' | 'name' | 'group_type' | 'color'>;
  inviter?: {
    id: string;
    name: string;
    avatar_url?: string;
    role: string;
  };
}

export interface ActivityFeedItem {
  id: string;
  actor_id: string;
  action: ActivityAction;
  target_type: 'event' | 'group' | 'user' | 'post';
  target_id: string;
  preschool_id: string;
  metadata: Record<string, any>;
  visibility: 'public' | 'group' | 'private';
  created_at: string;
  
  // Computed fields
  actor?: {
    id: string;
    name: string;
    avatar_url?: string;
    role: string;
  };
  target_details?: any; // Specific to target_type
}

export type ActivityAction = 
  | 'created_event' 
  | 'joined_group' 
  | 'shared_update' 
  | 'left_group'
  | 'invited_user'
  | 'accepted_invitation'
  | 'declined_invitation'
  | 'updated_group'
  | 'created_group'
  | 'deleted_group';

export type EventAudienceType = 'everyone' | 'principals' | 'teachers' | 'parents' | 'specific_groups' | 'specific_users';

export interface EventTargetingConfig {
  audience_type: EventAudienceType;
  audience_config: {
    group_ids?: string[];
    user_ids?: string[];
    role_filters?: string[];
    custom_criteria?: Record<string, any>;
  };
  requires_approval: boolean;
  auto_accept_roles: string[];
  visibility: 'public' | 'private' | 'restricted';
}

// Component Props Interfaces
export interface GroupCardProps {
  group: PrincipalGroup;
  onPress?: (group: PrincipalGroup) => void;
  onJoin?: (group: PrincipalGroup) => void;
  onLeave?: (group: PrincipalGroup) => void;
  showActions?: boolean;
  compact?: boolean;
}

export interface GroupMemberListProps {
  members: GroupMember[];
  currentUserRole?: GroupMemberRole;
  onRemoveMember?: (member: GroupMember) => void;
  onChangeRole?: (member: GroupMember, newRole: GroupMemberRole) => void;
  onInviteMembers?: () => void;
  canManageMembers?: boolean;
}

export interface EventTargetingSelectorProps {
  value: EventTargetingConfig;
  onChange: (config: EventTargetingConfig) => void;
  availableGroups: PrincipalGroup[];
  availableUsers: Array<{
    id: string;
    name: string;
    role: string;
    avatar_url?: string;
  }>;
}

export interface GroupInvitationCardProps {
  invitation: GroupInvitation;
  onAccept?: (invitation: GroupInvitation) => void;
  onDecline?: (invitation: GroupInvitation) => void;
  onCancel?: (invitation: GroupInvitation) => void;
  showActions?: boolean;
}

export interface ActivityFeedProps {
  activities: ActivityFeedItem[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
  emptyMessage?: string;
}

// Hook Interfaces
export interface UseGroupsResult {
  groups: PrincipalGroup[];
  loading: boolean;
  error: string | null;
  createGroup: (groupData: CreateGroupRequest) => Promise<PrincipalGroup>;
  updateGroup: (id: string, updates: Partial<PrincipalGroup>) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  joinGroup: (id: string) => Promise<void>;
  leaveGroup: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export interface UseGroupMembersResult {
  members: GroupMember[];
  loading: boolean;
  error: string | null;
  inviteMember: (userId: string, message?: string) => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
  updateMemberRole: (userId: string, role: GroupMemberRole) => Promise<void>;
  refresh: () => Promise<void>;
}

export interface UseEventInvitationsResult {
  invitations: EventInvitation[];
  loading: boolean;
  error: string | null;
  sendInvitation: (eventId: string, userId: string) => Promise<void>;
  respondToInvitation: (invitationId: string, status: 'accepted' | 'declined' | 'maybe', message?: string) => Promise<void>;
  cancelInvitation: (invitationId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export interface UseActivityFeedResult {
  activities: ActivityFeedItem[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

// Request/Response Types
export interface CreateGroupRequest {
  name: string;
  description?: string;
  group_type: PrincipalGroup['group_type'];
  color?: string;
  icon?: string;
  settings?: Record<string, any>;
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  is_active?: boolean;
  settings?: Record<string, any>;
}

export interface InviteGroupMemberRequest {
  user_id: string;
  message?: string;
  role?: GroupMemberRole;
}

export interface CreateEventWithTargetingRequest {
  // Basic event fields
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  location?: string;
  event_type: EnhancedEvent['event_type'];
  max_participants?: number;
  cover_image_url?: string;
  is_featured?: boolean;
  tags?: string[];
  
  // Targeting fields
  targeting: EventTargetingConfig;
  
  // Metadata
  metadata?: Record<string, any>;
}

export interface GroupSearchOptions {
  query?: string;
  group_type?: PrincipalGroup['group_type'];
  created_by?: string;
  is_active?: boolean;
  member_of?: boolean; // Filter to groups user is a member of
  limit?: number;
  offset?: number;
}

export interface EventVisibilityInfo {
  can_see: boolean;
  can_join: boolean;
  requires_approval: boolean;
  user_status?: 'not_invited' | 'invited' | 'registered' | 'attended' | 'declined';
  invitation?: EventInvitation;
  reason?: string; // Why user can't see/join
}
