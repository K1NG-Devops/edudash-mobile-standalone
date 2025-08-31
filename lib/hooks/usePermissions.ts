import { useAuth } from '@/contexts/SimpleWorkingAuth';
import { 
  Permission, 
  hasPermission, 
  hasAnyPermission, 
  hasAllPermissions,
  canManageGroup,
  canCreateEvent,
  canApproveEventRequests,
  getUserPermissions,
  isAdmin,
  isStaff,
  PERMISSIONS
} from '@/lib/utils/permissions';
import { GroupMemberRole } from '@/types/groups';

/**
 * Hook for managing user permissions throughout the app
 * Provides easy access to permission checking functions
 */
export const usePermissions = () => {
  const { user } = useAuth();

  return {
    // Permission checking functions
    hasPermission: (permission: Permission) => hasPermission(user, permission),
    hasAnyPermission: (permissions: Permission[]) => hasAnyPermission(user, permissions),
    hasAllPermissions: (permissions: Permission[]) => hasAllPermissions(user, permissions),
    
    // Specific permission checks
    canManageGroup: (groupRole?: GroupMemberRole) => canManageGroup(user, groupRole),
    canCreateEvent: () => canCreateEvent(user),
    canApproveEventRequests: () => canApproveEventRequests(user),
    canCreateGroup: () => hasPermission(user, PERMISSIONS.CREATE_GROUP),
    canManageUsers: () => hasPermission(user, PERMISSIONS.MANAGE_USERS),
    canPublishAnnouncements: () => hasPermission(user, PERMISSIONS.PUBLISH_ANNOUNCEMENTS),
    canViewAnalytics: () => hasPermission(user, PERMISSIONS.VIEW_ANALYTICS),
    canManageSchoolSettings: () => hasPermission(user, PERMISSIONS.MANAGE_SCHOOL_SETTINGS),
    
    // Role checks
    isAdmin: () => isAdmin(user),
    isStaff: () => isStaff(user),
    isPrincipal: () => user?.role === 'principal',
    isTeacher: () => user?.role === 'teacher',
    isParent: () => user?.role === 'parent',
    isSuperAdmin: () => user?.role === 'superadmin',
    
    // Get user's permissions
    userPermissions: getUserPermissions(user),
    
    // The user object for direct access if needed
    user,
  };
};
