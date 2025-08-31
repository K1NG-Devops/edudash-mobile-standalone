// Enhanced Events System Types
export interface EnhancedEvent {
  id: string;
  preschool_id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  location?: string;
  event_type: 'general' | 'field_trip' | 'performance' | 'celebration' | 'workshop' | 'sports' | 'arts' | 'academic';
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  max_participants?: number;
  cover_image_url?: string;
  is_featured: boolean;
  tags?: string[];
  metadata: Record<string, any>;
  created_by?: string;
  created_at: string;
  updated_at: string;
  
  // Computed fields
  stats?: EventStats;
  user_participation?: EventParticipant;
  recent_updates?: EventUpdate[];
  featured_media?: EventMedia[];
}

export interface EventUpdate {
  id: string;
  event_id: string;
  author_id: string;
  title?: string;
  content: string;
  update_type: 'general' | 'milestone' | 'announcement' | 'completion';
  is_live: boolean;
  posted_at: string;
  visibility: 'public' | 'parents_only' | 'staff_only';
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  
  // Computed fields
  author?: {
    id: string;
    name: string;
    avatar_url?: string;
    role: string;
  };
  media?: EventMedia[];
  reactions_summary?: ReactionsSummary;
  comments_count?: number;
  user_reaction?: EventReaction;
}

export interface EventMedia {
  id: string;
  event_id: string;
  update_id?: string;
  uploader_id: string;
  media_type: 'image' | 'video' | 'document';
  file_url: string;
  thumbnail_url?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  alt_text?: string;
  caption?: string;
  metadata: Record<string, any>;
  created_at: string;
  deleted_at?: string;
  
  // Computed fields
  uploader?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

export interface EventParticipant {
  id: string;
  event_id: string;
  user_id: string;
  student_id?: string;
  participation_type: 'attendee' | 'volunteer' | 'organizer' | 'performer';
  status: 'registered' | 'attended' | 'absent' | 'cancelled';
  registered_at: string;
  checked_in_at?: string;
  checked_out_at?: string;
  notes?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  
  // Computed fields
  user?: {
    id: string;
    name: string;
    avatar_url?: string;
    role: string;
  };
  student?: {
    id: string;
    name: string;
    avatar_url?: string;
    age?: number;
  };
}

export interface EventReaction {
  id: string;
  event_id?: string;
  update_id?: string;
  user_id: string;
  reaction_type: 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry' | 'comment';
  content?: string; // for comments
  parent_reaction_id?: string; // for comment replies
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  
  // Computed fields
  user?: {
    id: string;
    name: string;
    avatar_url?: string;
    role: string;
  };
  replies?: EventReaction[]; // for comments with replies
  replies_count?: number;
}

export interface EventNotification {
  id: string;
  event_id: string;
  update_id?: string;
  recipient_id: string;
  notification_type: 'event_created' | 'event_updated' | 'live_update' | 'event_starting' | 'event_ended' | 'new_media';
  title: string;
  message?: string;
  read_at?: string;
  sent_at: string;
  metadata: Record<string, any>;
  created_at: string;
  
  // Computed fields
  event?: {
    id: string;
    title: string;
    start_date: string;
  };
}

export interface EventStats {
  participants_count: number;
  updates_count: number;
  media_count: number;
  reactions_count: number;
  comments_count: number;
}

export interface ReactionsSummary {
  like: number;
  love: number;
  laugh: number;
  wow: number;
  sad: number;
  angry: number;
  total: number;
}

// Event creation and update interfaces
export interface CreateEventRequest {
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
  metadata?: Record<string, any>;
}

export interface UpdateEventRequest extends Partial<CreateEventRequest> {
  status?: EnhancedEvent['status'];
}

export interface CreateEventUpdateRequest {
  event_id: string;
  title?: string;
  content: string;
  update_type?: EventUpdate['update_type'];
  is_live?: boolean;
  visibility?: EventUpdate['visibility'];
  metadata?: Record<string, any>;
  media_files?: File[];
}

export interface CreateEventReactionRequest {
  event_id?: string;
  update_id?: string;
  reaction_type: EventReaction['reaction_type'];
  content?: string; // for comments
  parent_reaction_id?: string; // for comment replies
}

export interface EventParticipationRequest {
  event_id: string;
  student_id?: string;
  participation_type?: EventParticipant['participation_type'];
  notes?: string;
}

// Component props interfaces
export interface EventCardProps {
  event: EnhancedEvent;
  onPress?: (event: EnhancedEvent) => void;
  onParticipate?: (event: EnhancedEvent) => void;
  showActions?: boolean;
  compact?: boolean;
}

export interface EventUpdateCardProps {
  update: EventUpdate;
  onReact?: (reaction: CreateEventReactionRequest) => void;
  onComment?: (comment: string) => void;
  onMediaPress?: (media: EventMedia) => void;
  showActions?: boolean;
}

export interface EventTimelineProps {
  event: EnhancedEvent;
  updates: EventUpdate[];
  onPostUpdate?: (update: CreateEventUpdateRequest) => void;
  onReact?: (reaction: CreateEventReactionRequest) => void;
  canPost?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export interface EventMediaGalleryProps {
  media: EventMedia[];
  onMediaPress?: (media: EventMedia, index: number) => void;
  onUpload?: (files: File[]) => void;
  canUpload?: boolean;
  maxItems?: number;
}

export interface EventParticipantsProps {
  participants: EventParticipant[];
  onCheckIn?: (participant: EventParticipant) => void;
  onCheckOut?: (participant: EventParticipant) => void;
  canManage?: boolean;
}

// Hook interfaces
export interface UseEventUpdatesResult {
  updates: EventUpdate[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  postUpdate: (update: CreateEventUpdateRequest) => Promise<EventUpdate>;
  reactToUpdate: (reaction: CreateEventReactionRequest) => Promise<void>;
}

export interface UseEventNotificationsResult {
  notifications: EventNotification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationIds: string[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

export interface UseEventParticipationResult {
  isParticipating: boolean;
  participation: EventParticipant | null;
  loading: boolean;
  register: (request: EventParticipationRequest) => Promise<void>;
  unregister: () => Promise<void>;
  checkIn: () => Promise<void>;
  checkOut: () => Promise<void>;
}

// Filter and sorting interfaces
export interface EventFilters {
  status?: EnhancedEvent['status'][];
  event_type?: EnhancedEvent['event_type'][];
  tags?: string[];
  date_range?: {
    start: string;
    end: string;
  };
  is_featured?: boolean;
  has_updates?: boolean;
}

export interface EventSortOptions {
  field: 'start_date' | 'created_at' | 'title' | 'participants_count';
  direction: 'asc' | 'desc';
}

export interface EventSearchOptions {
  query?: string;
  filters?: EventFilters;
  sort?: EventSortOptions;
  limit?: number;
  offset?: number;
}
