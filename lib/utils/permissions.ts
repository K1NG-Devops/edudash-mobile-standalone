import { User } from '@/types/auth';
import { GroupMemberRole } from '@/types/groups';

export const ROLES = {
  SUPERADMIN: 'superadmin',
  PRINCIPAL: 'principal',
  PRESCHOOL_ADMIN: 'preschool_admin',
  TEACHER: 'teacher',
  PARENT: 'parent',
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

export const PERMISSIONS = {
  // Group Management
  CREATE_GROUP: 'create_group',
  UPDATE_GROUP: 'update_group',
  DELETE_GROUP: 'delete_group',
  MANAGE_GROUP_MEMBERS: 'manage_group_members',
  
  // Event Management
  CREATE_EVENT: 'create_event',
  UPDATE_EVENT: 'update_event',
  DELETE_EVENT: 'delete_event',
  APPROVE_EVENT_REQUESTS: 'approve_event_requests',
  
  // User Management
  INVITE_USERS: 'invite_users',
  MANAGE_USERS: 'manage_users',
  
  // Content Management
  PUBLISH_ANNOUNCEMENTS: 'publish_announcements',
  MODERATE_CONTENT: 'moderate_content',
  
  // School Management
  MANAGE_SCHOOL_SETTINGS: 'manage_school_settings',
  VIEW_ANALYTICS: 'view_analytics',
  MANAGE_BILLING: 'manage_billing',
  
  // Student Management
  MANAGE_STUDENTS: 'manage_students',
  VIEW_STUDENT_RECORDS: 'view_student_records',
  
  // Communication
  SEND_BULK_MESSAGES: 'send_bulk_messages',
  MANAGE_NOTIFICATIONS: 'manage_notifications',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Role-Permission Mapping
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [ROLES.SUPERADMIN]: Object.values(PERMISSIONS), // All permissions
  
  [ROLES.PRINCIPAL]: [
    PERMISSIONS.CREATE_GROUP,
    PERMISSIONS.UPDATE_GROUP,
    PERMISSIONS.DELETE_GROUP,
    PERMISSIONS.MANAGE_GROUP_MEMBERS,
    PERMISSIONS.CREATE_EVENT,
    PERMISSIONS.UPDATE_EVENT,
    PERMISSIONS.DELETE_EVENT,
    PERMISSIONS.APPROVE_EVENT_REQUESTS,
    PERMISSIONS.INVITE_USERS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.PUBLISH_ANNOUNCEMENTS,
    PERMISSIONS.MODERATE_CONTENT,
    PERMISSIONS.MANAGE_SCHOOL_SETTINGS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.MANAGE_BILLING,
    PERMISSIONS.MANAGE_STUDENTS,
    PERMISSIONS.VIEW_STUDENT_RECORDS,
    PERMISSIONS.SEND_BULK_MESSAGES,
    PERMISSIONS.MANAGE_NOTIFICATIONS,
  ],
  
  [ROLES.PRESCHOOL_ADMIN]: [
    PERMISSIONS.CREATE_GROUP,
    PERMISSIONS.UPDATE_GROUP,
    PERMISSIONS.DELETE_GROUP,
    PERMISSIONS.MANAGE_GROUP_MEMBERS,
    PERMISSIONS.CREATE_EVENT,
    PERMISSIONS.UPDATE_EVENT,
    PERMISSIONS.DELETE_EVENT,
    PERMISSIONS.APPROVE_EVENT_REQUESTS,
    PERMISSIONS.INVITE_USERS,
    PERMISSIONS.PUBLISH_ANNOUNCEMENTS,
    PERMISSIONS.MODERATE_CONTENT,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.MANAGE_STUDENTS,
    PERMISSIONS.VIEW_STUDENT_RECORDS,
    PERMISSIONS.SEND_BULK_MESSAGES,
  ],
  
  [ROLES.TEACHER]: [
    PERMISSIONS.CREATE_EVENT,
    PERMISSIONS.UPDATE_EVENT,
    PERMISSIONS.PUBLISH_ANNOUNCEMENTS,
    PERMISSIONS.VIEW_STUDENT_RECORDS,
  ],
  
  [ROLES.PARENT]: [
    // Parents have limited permissions
    // They can view content but not create/manage
  ],
};

// Group Role Permissions
const GROUP_ROLE_PERMISSIONS: Record<GroupMemberRole, string[]> = {
  admin: [
    'manage_members',
    'update_group',
    'delete_group',
    'moderate_content',
    'invite_members',
    'remove_members',
    'change_roles',
  ],
  moderator: [
    'manage_members',
    'moderate_content',
    'invite_members',
  ],
  member: [
    'view_content',
    'participate',
    'leave_group',
  ],
};

/**
 * Check if a user has a specific permission
 */
export const hasPermission = (user: User | null | undefined, permission: Permission): boolean => {
  if (!user) return false;
  
  const userRole = user.role as UserRole;
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  
  return permissions.includes(permission);
};

/**
 * Check if a user has any of the specified permissions
 */
export const hasAnyPermission = (user: User | null | undefined, permissions: Permission[]): boolean => {
  return permissions.some(permission => hasPermission(user, permission));
};

/**
 * Check if a user has all of the specified permissions
 */
export const hasAllPermissions = (user: User | null | undefined, permissions: Permission[]): boolean => {
  return permissions.every(permission => hasPermission(user, permission));
};

/**
 * Check if a group member has a specific permission within a group
 */
export const hasGroupPermission = (
  groupRole: GroupMemberRole | undefined,
  permission: string
): boolean => {
  if (!groupRole) return false;
  
  const permissions = GROUP_ROLE_PERMISSIONS[groupRole] || [];
  return permissions.includes(permission);
};

/**
 * Check if a user can manage a group (either through platform role or group role)
 */
export const canManageGroup = (user: User | null | undefined, groupRole?: GroupMemberRole): boolean => {
  // Principals and admins always can manage groups in their preschool
  if (hasPermission(user, PERMISSIONS.MANAGE_GROUP_MEMBERS)) {
    return true;
  }
  
  // Otherwise check group role
  return hasGroupPermission(groupRole, 'manage_members');
};

/**
 * Check if a user can create events
 */
export const canCreateEvent = (user: User | null | undefined): boolean => {
  return hasPermission(user, PERMISSIONS.CREATE_EVENT);
};

/**
 * Check if a user can approve event join requests
 */
export const canApproveEventRequests = (user: User | null | undefined): boolean => {
  return hasPermission(user, PERMISSIONS.APPROVE_EVENT_REQUESTS);
};

/**
 * Get all permissions for a user based on their role
 */
export const getUserPermissions = (user: User | null | undefined): Permission[] => {
  if (!user) return [];
  
  const userRole = user.role as UserRole;
  return ROLE_PERMISSIONS[userRole] || [];
};

/**
 * Get display name for a role
 */
export const getRoleDisplayName = (role: UserRole): string => {
  const roleNames: Record<UserRole, string> = {
    [ROLES.SUPERADMIN]: 'Super Admin',
    [ROLES.PRINCIPAL]: 'Principal',
    [ROLES.PRESCHOOL_ADMIN]: 'School Admin',
    [ROLES.TEACHER]: 'Teacher',
    [ROLES.PARENT]: 'Parent',
  };
  
  return roleNames[role] || role;
};

/**
 * Get color for a role (for UI badges, etc.)
 */
export const getRoleColor = (role: UserRole): string => {
  const roleColors: Record<UserRole, string> = {
    [ROLES.SUPERADMIN]: '#DC2626', // Red
    [ROLES.PRINCIPAL]: '#7C3AED', // Purple
    [ROLES.PRESCHOOL_ADMIN]: '#2563EB', // Blue
    [ROLES.TEACHER]: '#10B981', // Green
    [ROLES.PARENT]: '#F59E0B', // Amber
  };
  
  return roleColors[role] || '#6B7280'; // Gray fallback
};

/**
 * Check if a user is an administrator (principal or higher)
 */
export const isAdmin = (user: User | null | undefined): boolean => {
  if (!user) return false;
  
  const adminRoles: UserRole[] = [
    ROLES.SUPERADMIN,
    ROLES.PRINCIPAL,
    ROLES.PRESCHOOL_ADMIN,
  ];
  
  return adminRoles.includes(user.role as UserRole);
};

/**
 * Check if a user is a school staff member (teacher or higher)
 */
export const isStaff = (user: User | null | undefined): boolean => {
  if (!user) return false;
  
  const staffRoles: UserRole[] = [
    ROLES.SUPERADMIN,
    ROLES.PRINCIPAL,
    ROLES.PRESCHOOL_ADMIN,
    ROLES.TEACHER,
  ];
  
  return staffRoles.includes(user.role as UserRole);
};
