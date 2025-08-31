import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { Permission } from '@/lib/utils/permissions';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface ProtectedComponentProps {
  /**
   * Array of permissions to check
   */
  permissions?: Permission[];
  
  /**
   * Whether the user needs ALL permissions (true) or ANY permission (false)
   * Default: false (ANY permission)
   */
  requireAll?: boolean;
  
  /**
   * Children to render if permission check passes
   */
  children: React.ReactNode;
  
  /**
   * Optional fallback component to render if permission check fails
   * If not provided, shows default "no permission" message
   */
  fallback?: React.ReactNode;
  
  /**
   * Whether to hide the component entirely if permission check fails
   * Default: false (shows fallback)
   */
  hideOnFail?: boolean;
  
  /**
   * Custom message to show when permission is denied
   */
  message?: string;
}

/**
 * Component that conditionally renders children based on user permissions
 * 
 * @example
 * ```tsx
 * <ProtectedComponent permissions={[PERMISSIONS.CREATE_GROUP]}>
 *   <Button onPress={createGroup}>Create Group</Button>
 * </ProtectedComponent>
 * ```
 * 
 * @example With multiple permissions (ANY)
 * ```tsx
 * <ProtectedComponent permissions={[PERMISSIONS.CREATE_EVENT, PERMISSIONS.UPDATE_EVENT]}>
 *   <EventManagementPanel />
 * </ProtectedComponent>
 * ```
 * 
 * @example With multiple permissions (ALL required)
 * ```tsx
 * <ProtectedComponent 
 *   permissions={[PERMISSIONS.VIEW_ANALYTICS, PERMISSIONS.MANAGE_BILLING]} 
 *   requireAll
 * >
 *   <BillingDashboard />
 * </ProtectedComponent>
 * ```
 */
export const ProtectedComponent: React.FC<ProtectedComponentProps> = ({
  permissions = [],
  requireAll = false,
  children,
  fallback,
  hideOnFail = false,
  message = "You don't have permission to access this feature",
}) => {
  const { hasAnyPermission, hasAllPermissions } = usePermissions();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  // If no permissions specified, render children (no protection)
  if (permissions.length === 0) {
    return <>{children}</>;
  }

  // Check permissions
  const hasAccess = requireAll 
    ? hasAllPermissions(permissions) 
    : hasAnyPermission(permissions);

  // If access granted, render children
  if (hasAccess) {
    return <>{children}</>;
  }

  // If hideOnFail is true, don't render anything
  if (hideOnFail) {
    return null;
  }

  // If custom fallback provided, use it
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default fallback UI
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <IconSymbol 
          name="lock.fill" 
          size={48} 
          color={isDark ? '#64748B' : '#9CA3AF'} 
        />
        <Text style={[styles.message, { color: isDark ? '#64748B' : '#9CA3AF' }]}>
          {message}
        </Text>
      </View>
    </View>
  );
};

/**
 * HOC version of ProtectedComponent for wrapping entire components
 * 
 * @example
 * ```tsx
 * const ProtectedAdminPanel = withPermission(AdminPanel, {
 *   permissions: [PERMISSIONS.MANAGE_USERS],
 *   message: 'Admin access required'
 * });
 * ```
 */
export const withPermission = <P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ProtectedComponentProps, 'children'>
) => {
  return (props: P) => (
    <ProtectedComponent {...options}>
      <Component {...props} />
    </ProtectedComponent>
  );
};

/**
 * Role-based protection shortcuts
 */
export const AdminOnly: React.FC<Omit<ProtectedComponentProps, 'permissions'>> = (props) => {
  const { isAdmin } = usePermissions();
  
  if (isAdmin()) {
    return <>{props.children}</>;
  }
  
  if (props.hideOnFail) {
    return null;
  }
  
  if (props.fallback) {
    return <>{props.fallback}</>;
  }
  
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <IconSymbol 
          name="lock.fill" 
          size={48} 
          color={isDark ? '#64748B' : '#9CA3AF'} 
        />
        <Text style={[styles.message, { color: isDark ? '#64748B' : '#9CA3AF' }]}>
          {props.message || 'Administrator access required'}
        </Text>
      </View>
    </View>
  );
};

export const StaffOnly: React.FC<Omit<ProtectedComponentProps, 'permissions'>> = (props) => {
  const { isStaff } = usePermissions();
  
  if (isStaff()) {
    return <>{props.children}</>;
  }
  
  if (props.hideOnFail) {
    return null;
  }
  
  if (props.fallback) {
    return <>{props.fallback}</>;
  }
  
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <IconSymbol 
          name="lock.fill" 
          size={48} 
          color={isDark ? '#64748B' : '#9CA3AF'} 
        />
        <Text style={[styles.message, { color: isDark ? '#64748B' : '#9CA3AF' }]}>
          {props.message || 'Staff access required'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
});
