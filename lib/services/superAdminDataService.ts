/**
 * Super Admin Data Service
 * Handles all super admin operations for EduDash Pro SaaS platform
 * Platform-wide control, monitoring, and management
 */

import { supabase, supabaseAdmin } from '@/lib/supabase';
import { createLogger } from '@/lib/utils/logger';
import { Database } from '@/types/database';
const log = createLogger('superadmin');

type Tables = Database['public']['Tables'];
type User = Tables['users']['Row'];
type Preschool = Tables['preschools']['Row'];
type Student = Tables['students']['Row'];

export interface PlatformStats {
  total_schools: number;
  total_users: number;
  total_students: number;
  total_teachers: number;
  total_parents: number;
  active_subscriptions: number;
  monthly_revenue: number;
  growth_rate: number;
  ai_usage_count: number;
  storage_usage_gb: number;
}

export interface SchoolOverview extends Preschool {
  user_count: number;
  student_count: number;
  teacher_count: number;
  parent_count: number;
  last_activity: string;
  subscription_status: 'active' | 'inactive' | 'trial' | 'suspended';
  monthly_fee: number;
  ai_usage: number;
  storage_usage: number;
}

export interface UserOverview extends User {
  school_name: string | null;
  last_login: string | null;
  is_suspended: boolean;
  subscription_status: string | null;
  total_students: number;
  account_status: 'active' | 'inactive' | 'suspended' | 'pending';
}

export interface PlatformActivity {
  id: string;
  type: 'user_registration' | 'school_created' | 'subscription_change' | 'payment_received' | 'ai_usage' | 'security_alert';
  title: string;
  description: string;
  timestamp: string;
  user_id?: string;
  school_id?: string;
  metadata?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface SystemHealth {
  database_status: 'healthy' | 'warning' | 'error';
  api_response_time: number;
  uptime_percentage: number;
  active_connections: number;
  storage_usage_percentage: number;
  bandwidth_usage_gb: number;
  error_rate_percentage: number;
  last_backup: string;
}

export interface SuperAdminDashboardData {
  platform_stats: PlatformStats;
  recent_schools: SchoolOverview[];
  recent_users: UserOverview[];
  platform_activity: PlatformActivity[];
  system_health: SystemHealth;
  pending_approvals: {
    schools: number;
    users: number;
    content_reports: number;
  };
  alerts: {
    id: string;
    type: 'payment_failed' | 'system_error' | 'abuse_report' | 'security_breach';
    message: string;
    timestamp: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
  }[];
}

export class SuperAdminDataService {

  /**
   * Get comprehensive super admin dashboard data
   */
  static async getSuperAdminDashboardData(superAdminUserId: string): Promise<SuperAdminDashboardData> {
    try {

      // Verify super admin permissions
      const hasPermission = await this.verifySuperAdminPermissions(superAdminUserId);
      if (!hasPermission) {
        throw new Error('Access denied: Super admin permissions required');
      }

      // Fetch all dashboard data in parallel
      const [
        platformStats,
        recentSchools,
        recentUsers,
        platformActivity,
        systemHealth,
        pendingApprovals,
        alerts
      ] = await Promise.all([
        this.getPlatformStats(),
        this.getRecentSchools(),
        this.getRecentUsers(),
        this.getPlatformActivity(),
        this.getSystemHealth(),
        this.getPendingApprovals(),
        this.getSystemAlerts()
      ]);

      return {
        platform_stats: platformStats,
        recent_schools: recentSchools,
        recent_users: recentUsers,
        platform_activity: platformActivity,
        system_health: systemHealth,
        pending_approvals: pendingApprovals,
        alerts: alerts
      };

    } catch (error) {
      console.error('❌ [SuperAdmin] Error fetching dashboard data:', error);
      throw error;
    }
  }

  /**
   * Verify super admin permissions
   */
  static async verifySuperAdminPermissions(userId: string): Promise<boolean> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('role, is_active')
        .eq('auth_user_id', userId)
        .single();

      if (error || !user) {
        console.error('❌ [SuperAdmin] User not found:', error);
        return false;
      }

      return user.role === 'superadmin' && !!user.is_active;
    } catch (error) {
      console.error('❌ [SuperAdmin] Permission verification failed:', error);
      return false;
    }
  }

  /**
   * Get platform-wide statistics
   */
  static async getPlatformStats(): Promise<PlatformStats> {
    try {
      // Get school count
      const { count: schoolCount } = await supabase
        .from('preschools')
        .select('*', { count: 'exact', head: true });

      // Get user counts by role
      const { data: userStats } = await supabase
        .from('users')
        .select('role')
        .eq('is_active', true);

      const userCounts = userStats?.reduce((acc: Record<string, number>, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        acc.total = (acc.total || 0) + 1;
        return acc;
      }, {}) || {};

      // Get student count
      const { count: studentCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Calculate subscription stats (real values available)
      const { data: subscriptions } = await supabase
        .from('preschools')
        .select('subscription_status, subscription_plan');

      const activeSubscriptions = subscriptions?.filter(s => s.subscription_status === 'active').length || 0;

      // Best-effort counts for optional fields (fallback to 0 if table not present)
      let aiUsageCount = 0;
      try {
        const { count: aiCount, error: aiError } = await supabase
          .from('ai_usage_logs' as any)
          .select('*', { count: 'exact', head: true });
        if (!aiError && aiCount !== null && aiCount !== undefined) {
          aiUsageCount = aiCount;
        } else {
          // Table likely doesn't exist, use fallback
          aiUsageCount = 0;
        }
      } catch (_) {
        // Table doesn't exist or other error
        aiUsageCount = 0;
      }

      return {
        total_schools: schoolCount || 0,
        total_users: userCounts.total || 0,
        total_students: studentCount || 0,
        total_teachers: userCounts.teacher || 0,
        total_parents: userCounts.parent || 0,
        active_subscriptions: activeSubscriptions,
        // The following metrics require external systems; return 0 until integrated
        monthly_revenue: 0,
        growth_rate: 0,
        ai_usage_count: aiUsageCount,
        storage_usage_gb: 0
      };
    } catch (error) {
      console.error('❌ [SuperAdmin] Error fetching platform stats:', error);
      return {
        total_schools: 0,
        total_users: 0,
        total_students: 0,
        total_teachers: 0,
        total_parents: 0,
        active_subscriptions: 0,
        monthly_revenue: 0,
        growth_rate: 0,
        ai_usage_count: 0,
        storage_usage_gb: 0
      };
    }
  }

  /**
   * Get recent schools with detailed info
   */
  static async getRecentSchools(): Promise<SchoolOverview[]> {
    try {
      const { data: schools, error } = await supabase
        .from('preschools')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error || !schools) {
        console.error('❌ [SuperAdmin] Error fetching schools:', error);
        return [];
      }

      // Enhance each school with user counts (pure DB-derived)
      const enhancedSchools = await Promise.all(
        schools.map(async (school) => {
          const [userCount, studentCount] = await Promise.all([
            this.getSchoolUserCount(school.id),
            this.getSchoolStudentCount(school.id)
          ]);

          // Optional: derive teachers/parents if roles are in users
          let teachers = 0;
          let parents = 0;
          try {
            const { data: roleCounts } = await supabase
              .from('users')
              .select('role')
              .eq('preschool_id', school.id)
              .eq('is_active', true);
            roleCounts?.forEach((u: any) => {
              if (u.role === 'teacher') teachers += 1;
              if (u.role === 'parent') parents += 1;
            });
          } catch (_) { }

          const enhanced: SchoolOverview = {
            ...school,
            user_count: userCount.total,
            student_count: studentCount,
            teacher_count: teachers,
            parent_count: parents,
            last_activity: (school as any).updated_at || (school as any).created_at || new Date().toISOString(),
            subscription_status: school.subscription_status as any || 'active',
            monthly_fee: 0,
            ai_usage: 0,
            storage_usage: 0
          };

          return enhanced;
        })
      );

      return enhancedSchools;
    } catch (error) {
      console.error('❌ [SuperAdmin] Error fetching recent schools:', error);
      return [];
    }
  }

  /**
   * Get recent users across all schools
   */
  static async getRecentUsers(): Promise<UserOverview[]> {
    try {
      // Get users first
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error || !users) {
        console.error('❌ [SuperAdmin] Error fetching users:', error);
        return [];
      }

      // Get school names separately to avoid foreign key relationship issues
      const schoolIds = users.map(u => u.preschool_id).filter(Boolean);
      let schoolsMap: Record<string, string> = {};
      
      if (schoolIds.length > 0) {
        try {
          const { data: schools } = await supabase
            .from('preschools')
            .select('id, name')
            .in('id', schoolIds);
          
          if (schools) {
            schoolsMap = schools.reduce((acc, school) => {
              acc[school.id] = school.name;
              return acc;
            }, {} as Record<string, string>);
          }
        } catch (schoolError) {
          console.warn('⚠️ [SuperAdmin] Could not fetch school names:', schoolError);
        }
      }

      const enhancedUsers: UserOverview[] = users.map((user: any) => ({
        ...user,
        school_name: user.preschool_id ? schoolsMap[user.preschool_id] || null : null,
        // These fields require external sources; provide DB-derived only
        last_login: null,
        is_suspended: !user.is_active,
        subscription_status: null,
        total_students: 0,
        account_status: user.is_active ? 'active' : 'inactive'
      }));

      return enhancedUsers;
    } catch (error) {
      console.error('❌ [SuperAdmin] Error fetching recent users:', error);
      return [];
    }
  }

  /**
   * Get platform activity feed from multiple sources
   */
  static async getPlatformActivity(): Promise<PlatformActivity[]> {
    try {
      const activities: PlatformActivity[] = [];

      // Get recent preschool registrations
      const { data: recentSchools } = await supabase
        .from('preschools')
        .select('id, name, created_at, subscription_plan')
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentSchools) {
        recentSchools.forEach(school => {
          activities.push({
            id: `school-${school.id}`,
            type: 'school_created',
            title: 'New School Registered',
            description: `${school.name} joined the platform with ${school.subscription_plan} plan`,
            timestamp: school.created_at,
            school_id: school.id,
            severity: 'low'
          });
        });
      }

      // Get recent user registrations
      const { data: recentUsers } = await supabase
        .from('users')
        .select('id, name, role, created_at, preschool_id')
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentUsers) {
        // Get school names for users that have preschool_id
        const userSchoolIds = recentUsers.map(u => u.preschool_id).filter(Boolean);
        let userSchoolsMap: Record<string, string> = {};
        
        if (userSchoolIds.length > 0) {
          try {
            const { data: userSchools } = await supabase
              .from('preschools')
              .select('id, name')
              .in('id', userSchoolIds);
            
            if (userSchools) {
              userSchoolsMap = userSchools.reduce((acc, school) => {
                acc[school.id] = school.name;
                return acc;
              }, {} as Record<string, string>);
            }
          } catch (schoolError) {
            console.warn('⚠️ [SuperAdmin] Could not fetch school names for activity:', schoolError);
          }
        }

        recentUsers.forEach(user => {
          const schoolName = user.preschool_id ? userSchoolsMap[user.preschool_id] || 'Unknown School' : 'the platform';
          activities.push({
            id: `user-${user.id}`,
            type: 'user_registration',
            title: 'New User Registration',
            description: `${user.name} (${user.role}) joined ${schoolName}`,
            timestamp: user.created_at,
            user_id: user.id,
            severity: 'low'
          });
        });
      }

      // Get system logs for critical issues (if table exists)
      try {
        const { data: systemLogs, error: systemError } = await supabase
          .from('system_logs')
          .select('*')
          .in('severity', ['high', 'critical'])
          .order('created_at', { ascending: false })
          .limit(5);

        if (!systemError && systemLogs) {
          systemLogs.forEach(log => {
            activities.push({
              id: `log-${log.id}`,
              type: 'security_alert',
              title: 'System Alert',
              description: log.message || 'System issue detected',
              timestamp: log.created_at,
              severity: log.severity as any
            });
          });
        }
      } catch (error) {
        console.warn('⚠️ [SuperAdmin] System logs table not available:', error);
      }

      // Sort all activities by timestamp (newest first)
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 20);

    } catch (error) {
      console.error('❌ [SuperAdmin] Error fetching platform activity:', error);
      return [];
    }
  }

  /**
   * Get system health metrics from database and system monitoring
   */
  static async getSystemHealth(): Promise<SystemHealth> {
    try {
      const startTime = Date.now();
      let databaseStatus: 'healthy' | 'warning' | 'error' = 'healthy';
      let activeConnections = 0;
      let apiResponseTime = 0;

      // Test database connectivity and measure response time
      try {
        const { count: testQuery, error: dbError } = await supabase
          .from('preschools')
          .select('*', { count: 'exact', head: true })
          .limit(1);

        apiResponseTime = Date.now() - startTime;

        if (dbError) {
          console.error('❌ [SuperAdmin] Database health check failed:', dbError);
          databaseStatus = 'error';
        } else {
          databaseStatus = apiResponseTime > 2000 ? 'warning' : 'healthy';
        }
      } catch (error) {
        console.error('❌ [SuperAdmin] Database health check failed:', error);
        databaseStatus = 'error';
        apiResponseTime = Date.now() - startTime;
      }

      // Get active connections count (PostgreSQL specific)
      try {
        // Try to get active connections via RPC function
        const { data: connections, error: rpcError } = await supabase
          .rpc('get_active_connections' as any);
        if (!rpcError && connections) {
          activeConnections = connections;
        } else {
          throw new Error('RPC function not available');
        }
      } catch (error) {
        // Fallback: estimate based on recent activity
        try {
          const { count: recentUserActivity } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .gte('updated_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
            .limit(100);
          activeConnections = recentUserActivity || 0;
        } catch (fallbackError) {
          // Final fallback - use a small number
          activeConnections = 5;
        }
      }

      // Calculate storage usage percentage (estimate based on data volume)
      let storageUsagePercentage = 0;
      try {
        const [schoolCount, userCount, studentCount] = await Promise.all([
          supabase.from('preschools').select('*', { count: 'exact', head: true }),
          supabase.from('users').select('*', { count: 'exact', head: true }),
          supabase.from('students').select('*', { count: 'exact', head: true })
        ]);

        const totalRecords = (schoolCount.count || 0) + (userCount.count || 0) + (studentCount.count || 0);
        // Rough estimate: each record ~1KB, storage limit assumed 10GB
        storageUsagePercentage = Math.min(Math.round((totalRecords * 1024) / (10 * 1024 * 1024 * 1024) * 100), 100);
      } catch (error) {
        console.warn('⚠️ [SuperAdmin] Storage calculation failed:', error);
      }

      // Calculate error rate from system logs
      let errorRatePercentage = 0;
      try {
        const { count: totalLogs, error: totalError } = await supabase
          .from('system_logs')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

        if (totalError) {
          // system_logs table doesn't exist, use default
          errorRatePercentage = 0;
        } else {
          const { count: errorLogs, error: errorError } = await supabase
            .from('system_logs')
            .select('*', { count: 'exact', head: true })
            .in('severity', ['high', 'critical'])
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

          if (!errorError && totalLogs && totalLogs > 0) {
            errorRatePercentage = Math.round(((errorLogs || 0) / totalLogs) * 100);
          }
        }
      } catch (error) {
        console.warn('⚠️ [SuperAdmin] Error rate calculation failed (system_logs table likely missing):', error);
        errorRatePercentage = 0;
      }

      // Calculate uptime (simplified based on system status)
      const uptimePercentage = databaseStatus === 'error' ? 95 :
        databaseStatus === 'warning' ? 99 : 99.9;

      return {
        database_status: databaseStatus,
        api_response_time: apiResponseTime,
        uptime_percentage: uptimePercentage,
        active_connections: activeConnections,
        storage_usage_percentage: storageUsagePercentage,
        bandwidth_usage_gb: Math.round(activeConnections * 0.1 * 100) / 100, // Rough estimate
        error_rate_percentage: errorRatePercentage,
        last_backup: new Date().toISOString() // Would come from backup system
      };
    } catch (error) {
      console.error('❌ [SuperAdmin] Error calculating system health:', error);
      return {
        database_status: 'error',
        api_response_time: 0,
        uptime_percentage: 90,
        active_connections: 0,
        storage_usage_percentage: 0,
        bandwidth_usage_gb: 0,
        error_rate_percentage: 5,
        last_backup: new Date().toISOString()
      };
    }
  }

  /**
   * Get pending approvals count from various sources
   */
  static async getPendingApprovals() {
    try {
      // Get pending onboarding requests (schools)
      const { count: pendingSchools } = await supabase
        .from('preschool_onboarding_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Get inactive users that might need approval
      const { count: pendingUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', false)
        .neq('role', 'superadmin');

      // Get open support tickets as content reports (if table exists)
      let contentReports = 0;
      try {
        const { count: reports, error: reportsError } = await supabase
          .from('support_tickets')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'open');

        if (!reportsError && reports !== null && reports !== undefined) {
          contentReports = reports;
        }
      } catch (error) {
        console.warn('⚠️ [SuperAdmin] Support tickets table not available:', error);
        contentReports = 0;
      }

      return {
        schools: pendingSchools || 0,
        users: pendingUsers || 0,
        content_reports: contentReports
      };
    } catch (error) {
      console.error('❌ [SuperAdmin] Error fetching pending approvals:', error);
      return {
        schools: 0,
        users: 0,
        content_reports: 0
      };
    }
  }

  /**
   * Get system alerts from various sources
   */
  static async getSystemAlerts() {
    try {
      const alerts: any[] = [];

      // Get critical system logs as alerts
      const { data: criticalLogs } = await supabase
        .from('system_logs')
        .select('*')
        .eq('severity', 'critical')
        .order('created_at', { ascending: false })
        .limit(5);

      if (criticalLogs) {
        criticalLogs.forEach(log => {
          alerts.push({
            id: `system-${log.id}`,
            type: 'system_error',
            message: log.message || 'Critical system issue detected',
            timestamp: log.created_at,
            priority: 'critical'
          });
        });
      }

      // Get support tickets with high priority as alerts
      const { data: urgentTickets } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(3);

      if (urgentTickets) {
        urgentTickets.forEach(ticket => {
          alerts.push({
            id: `ticket-${ticket.id}`,
            type: 'abuse_report',
            message: `Support ticket: ${ticket.subject}`,
            timestamp: ticket.created_at,
            priority: 'medium'
          });
        });
      }

      // Get suspended schools as security alerts
      const { data: suspendedSchools } = await supabase
        .from('preschools')
        .select('id, name, updated_at')
        .eq('subscription_status', 'suspended')
        .order('updated_at', { ascending: false })
        .limit(3);

      if (suspendedSchools) {
        suspendedSchools.forEach(school => {
          alerts.push({
            id: `suspended-${school.id}`,
            type: 'security_breach',
            message: `School ${school.name} has been suspended`,
            timestamp: school.updated_at || new Date().toISOString(),
            priority: 'high'
          });
        });
      }

      // Sort alerts by timestamp (newest first)
      return alerts
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);

    } catch (error) {
      console.error('❌ [SuperAdmin] Error fetching system alerts:', error);
      return [];
    }
  }

  /**
   * Helper methods
   */

  static async getSchoolUserCount(schoolId: string) {
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('preschool_id', schoolId)
      .eq('is_active', true);

    return { total: count || 0 };
  }

  static async getSchoolStudentCount(schoolId: string) {
    const { count } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('preschool_id', schoolId)
      .eq('is_active', true);

    return count || 0;
  }

  /**
   * Super Admin Actions
   */

  static async suspendSchool(schoolId: string, reason: string) {
    try {
      const { error } = await supabase
        .from('preschools')
        .update({
          subscription_status: 'suspended',
          updated_at: new Date().toISOString()
        })
        .eq('id', schoolId);

      if (error) throw error;

      // Log the action

      return { success: true };
    } catch (error) {
      console.error('❌ [SuperAdmin] Error suspending school:', error);
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  }

  static async suspendUser(userId: string, reason: string) {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('❌ [SuperAdmin] Error suspending user:', error);
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  }

  static async createSchool(schoolData: {
    name: string;
    email: string;
    admin_name: string;
    subscription_plan?: string;
  }) {
    try {
      console.log('🏫 [SuperAdmin] Creating school:', schoolData);

      // First, create the school record
      const { data: schoolRecord, error: schoolError } = await supabase
        .from('preschools')
        .insert({
          name: schoolData.name,
          email: schoolData.email,
          subscription_plan: schoolData.subscription_plan || 'trial',
          subscription_status: 'active',
          tenant_slug: schoolData.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
          onboarding_status: 'completed',
          setup_completed: true
        })
        .select('*')
        .single();

      if (schoolError) {
        console.error('❌ [SuperAdmin] Error creating school record:', schoolError);
        throw schoolError;
      }

      console.log('✅ [SuperAdmin] School record created:', schoolRecord.id);

      // Create a temporary password that meets all Supabase requirements:
      // - lowercase letters, uppercase letters, digits, symbols
      const generateSecurePassword = () => {
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const digits = '0123456789';
        const symbols = '!@#$%^&*';

        // Ensure at least one character from each required category
        const password = [
          lowercase[Math.floor(Math.random() * lowercase.length)],
          uppercase[Math.floor(Math.random() * uppercase.length)],
          digits[Math.floor(Math.random() * digits.length)],
          symbols[Math.floor(Math.random() * symbols.length)]
        ];

        // Fill remaining positions with random characters from all categories
        const allChars = lowercase + uppercase + digits + symbols;
        for (let i = 4; i < 12; i++) {
          password.push(allChars[Math.floor(Math.random() * allChars.length)]);
        }

        // Shuffle the password array and join
        return password.sort(() => Math.random() - 0.5).join('');
      };

      const tempPassword = generateSecurePassword();

      // Create auth user with preschool_id in metadata to help the trigger
      console.log('🔐 [SuperAdmin] Creating auth user with preschool context...');

      // Prefer service-role client when available (local/dev). In production mobile apps, server functions should be used.
      const adminClient = supabaseAdmin ?? null;
      const { data: authUser, error: authError } = adminClient
        ? await adminClient.auth.admin.createUser({
          email: schoolData.email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            name: schoolData.admin_name,
            role: 'principal',
            preschool_id: schoolRecord.id,
            school_id: schoolRecord.id,
            school_name: schoolData.name,
            created_via: 'admin_approval'
          }
        })
        : { data: null as any, error: new Error('Service role client unavailable') as any };

      if (authError) {
        console.error('❌ [SuperAdmin] Error creating auth user:', authError);
        console.error('❌ [SuperAdmin] Auth error details:', authError.message);

        // Rollback school creation
        await supabase.from('preschools').delete().eq('id', schoolRecord.id);

        return {
          success: false,
          error: `School created but admin user creation failed: ${authError.message}. School ID: ${schoolRecord.id}. Please create the admin user manually.`,
          school_id: schoolRecord.id,
          manual_setup_required: true
        };
      }

      console.log('✅ [SuperAdmin] Auth user created:', authUser.user?.id);

      // Wait a moment for trigger to complete, then check if user profile was created
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if the trigger created the user profile
      const { data: existingProfile, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authUser.user!.id)
        .single();

      if (checkError || !existingProfile) {
        console.log('🔧 [SuperAdmin] Trigger did not create user profile, creating manually...');

        // Manually create the user profile record since trigger failed
        const { error: userInsertError } = await supabase
          .from('users')
          .insert({
            auth_user_id: authUser.user!.id,
            email: schoolData.email,
            name: schoolData.admin_name,
            role: 'principal',
            preschool_id: schoolRecord.id,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (userInsertError) {
          console.error('❌ [SuperAdmin] Error creating user profile manually:', userInsertError);
          console.warn('⚠️ [SuperAdmin] User profile creation failed, but auth user exists.');
          // Don't fail the entire process - at minimum the auth user exists
        } else {
          console.log('✅ [SuperAdmin] User profile created manually');
        }
      } else {
        console.log('✅ [SuperAdmin] User profile created by trigger, updating with preschool info...');

        // Update the profile with the preschool information
        const { error: updateError } = await supabase
          .from('users')
          .update({
            preschool_id: schoolRecord.id,
            role: 'principal',
            name: schoolData.admin_name,
            updated_at: new Date().toISOString()
          })
          .eq('auth_user_id', authUser.user!.id);

        if (updateError) {
          console.warn('⚠️ [SuperAdmin] Could not update user profile with preschool info:', updateError);
        } else {
          console.log('✅ [SuperAdmin] User profile updated with preschool info');
        }
      }

      console.log('✅ [SuperAdmin] School and admin created successfully');

      // Send welcome email with login credentials and onboarding guide
      try {
        await this.sendWelcomeEmail({
          schoolName: schoolData.name,
          adminName: schoolData.admin_name,
          adminEmail: schoolData.email,
          tempPassword: tempPassword,
          schoolId: schoolRecord.id
        });
        console.log('📧 [SuperAdmin] Welcome email sent successfully');
      } catch (emailError) {
        console.error('❌ [SuperAdmin] Failed to send welcome email:', emailError);
        // Don't fail the entire process if email fails
      }

      // Log the temporary password for admin reference
      console.log(`🔑 [SuperAdmin] Temporary password for ${schoolData.email}: ${tempPassword}`);

      return {
        success: true,
        school_id: schoolRecord.id,
        admin_email: schoolData.email,
        temp_password: tempPassword
      };
    } catch (error) {
      console.error('❌ [SuperAdmin] Error creating school:', error);
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  }

  /**
   * Send welcome email to newly approved school admin
   */
  static async sendWelcomeEmail(emailData: {
    schoolName: string;
    adminName: string;
    adminEmail: string;
    tempPassword: string;
    schoolId: string;
  }) {
    const { schoolName, adminName, adminEmail, tempPassword, schoolId } = emailData;

    // Create comprehensive welcome email template
    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to EduDash Pro - Account Approved!</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">🎉 Welcome to EduDash Pro!</h1>
                  <p style="color: #ffffff; margin: 15px 0 0 0; font-size: 18px; opacity: 0.9;">Your school has been approved!</p>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 30px;">
                  <h2 style="color: #065f46; margin: 0 0 20px 0; font-size: 26px;">🏫 ${schoolName} is now live!</h2>
                  
                  <p style="color: #374151; line-height: 1.6; margin: 0 0 25px 0; font-size: 16px;">
                      Dear ${adminName},
                  </p>
                  
                  <p style="color: #374151; line-height: 1.6; margin: 0 0 25px 0; font-size: 16px;">
                      <strong>Congratulations!</strong> Your school registration for <strong>${schoolName}</strong> has been approved and your EduDash Pro account is now active. You can start managing your preschool immediately!
                  </p>
                  
                  <!-- Login Credentials Card -->
                  <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 12px; padding: 30px; margin: 30px 0; border: 2px solid #10b981;">
                      <h3 style="color: #065f46; margin: 0 0 20px 0; font-size: 20px; text-align: center;">🔑 Your Login Credentials</h3>
                      
                      <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                          <div style="margin-bottom: 15px;">
                              <span style="font-weight: 600; color: #374151; display: block; margin-bottom: 5px;">📧 Email Address:</span>
                              <span style="color: #059669; font-size: 18px; font-weight: 600; font-family: 'Courier New', monospace;">${adminEmail}</span>
                          </div>
                          
                          <div style="margin-bottom: 15px;">
                              <span style="font-weight: 600; color: #374151; display: block; margin-bottom: 5px;">🔐 Temporary Password:</span>
                              <span style="color: #dc2626; font-size: 18px; font-weight: 600; font-family: 'Courier New', monospace; background-color: #fef2f2; padding: 8px 12px; border-radius: 6px; display: inline-block;">${tempPassword}</span>
                          </div>
                          
                          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-top: 20px; border-radius: 6px;">
                              <p style="margin: 0; color: #92400e; font-size: 14px;">⚠️ <strong>Important:</strong> Please change your password after your first login for security.</p>
                          </div>
                      </div>
                      
                      <!-- Login Button -->
                      <div style="text-align: center;">
                          <a href="https://app.edudashpro.org.za/login" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                              🚀 Login to Your Dashboard
                          </a>
                      </div>
                  </div>
                  
                  <!-- Getting Started Guide -->
                  <div style="background-color: #f8fafc; border-radius: 12px; padding: 30px; margin: 30px 0; border-left: 4px solid #6366f1;">
                      <h3 style="color: #4338ca; margin: 0 0 20px 0; font-size: 20px;">🎯 Getting Started - Your Next Steps</h3>
                      
                      <div style="margin-bottom: 15px;">
                          <strong style="color: #4338ca;">1. Complete Your Profile</strong>
                          <p style="margin: 5px 0 0 0; color: #4b5563; font-size: 14px;">Add your school logo, contact information, and preferences.</p>
                      </div>
                      
                      <div style="margin-bottom: 15px;">
                          <strong style="color: #4338ca;">2. Set Up Classes & Age Groups</strong>
                          <p style="margin: 5px 0 0 0; color: #4b5563; font-size: 14px;">Create your class structure and define age groups for your students.</p>
                      </div>
                      
                      <div style="margin-bottom: 15px;">
                          <strong style="color: #4338ca;">3. Invite Teachers & Staff</strong>
                          <p style="margin: 5px 0 0 0; color: #4b5563; font-size: 14px;">Send invitations to your teaching staff to join the platform.</p>
                      </div>
                      
                      <div style="margin-bottom: 15px;">
                          <strong style="color: #4338ca;">4. Register Students</strong>
                          <p style="margin: 5px 0 0 0; color: #4b5563; font-size: 14px;">Add your students and connect them with their parents.</p>
                      </div>
                      
                      <div>
                          <strong style="color: #4338ca;">5. Start Creating Learning Content</strong>
                          <p style="margin: 5px 0 0 0; color: #4b5563; font-size: 14px;">Begin adding lessons, activities, and educational materials.</p>
                      </div>
                  </div>
                  
                  <!-- Features Overview -->
                  <div style="background: linear-gradient(135deg, #fef7ff 0%, #f3e8ff 100%); border-radius: 12px; padding: 30px; margin: 30px 0; border: 2px solid #8b5cf6;">
                      <h3 style="color: #7c3aed; margin: 0 0 20px 0; font-size: 20px; text-align: center;">✨ Platform Features</h3>
                      
                      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px;">
                          <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; text-align: center;">
                              <div style="font-size: 24px; margin-bottom: 8px;">👥</div>
                              <div style="font-weight: 600; color: #7c3aed; font-size: 14px;">Student Management</div>
                          </div>
                          
                          <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; text-align: center;">
                              <div style="font-size: 24px; margin-bottom: 8px;">📚</div>
                              <div style="font-weight: 600; color: #7c3aed; font-size: 14px;">Lesson Planning</div>
                          </div>
                          
                          <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; text-align: center;">
                              <div style="font-size: 24px; margin-bottom: 8px;">💬</div>
                              <div style="font-weight: 600; color: #7c3aed; font-size: 14px;">Parent Communication</div>
                          </div>
                          
                          <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; text-align: center;">
                              <div style="font-size: 24px; margin-bottom: 8px;">📊</div>
                              <div style="font-weight: 600; color: #7c3aed; font-size: 14px;">Progress Tracking</div>
                          </div>
                      </div>
                  </div>
                  
                  <!-- Support Information -->
                  <div style="background-color: #eff6ff; border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #3b82f6;">
                      <h3 style="color: #1d4ed8; margin: 0 0 15px 0; font-size: 18px;">💪 Need Help Getting Started?</h3>
                      
                      <p style="color: #1e40af; margin: 0 0 15px 0; font-size: 14px;">Our support team is here to help you every step of the way:</p>
                      
                      <div style="margin-bottom: 10px;">
                          <span style="color: #1d4ed8; font-weight: 600;">📧 Email:</span>
                          <a href="mailto:support@edudashpro.org.za" style="color: #2563eb; margin-left: 8px;">support@edudashpro.org.za</a>
                      </div>
                      
                      <div style="margin-bottom: 10px;">
                          <span style="color: #1d4ed8; font-weight: 600;">📞 Phone:</span>
                          <span style="color: #1e40af; margin-left: 8px;">+27 11 234 5678</span>
                      </div>
                      
                      <div>
                          <span style="color: #1d4ed8; font-weight: 600;">🕒 Hours:</span>
                          <span style="color: #1e40af; margin-left: 8px;">Monday - Friday, 8:00 AM - 6:00 PM SAST</span>
                      </div>
                  </div>
                  
                  <!-- Subscription Info -->
                  <div style="background-color: #f0fdf4; border-radius: 12px; padding: 25px; margin: 30px 0; border: 1px solid #22c55e;">
                      <h3 style="color: #15803d; margin: 0 0 15px 0; font-size: 18px;">🎁 Your Trial Subscription</h3>
                      <p style="color: #16a34a; margin: 0; font-size: 14px;">
                          You're currently on our <strong>Trial Plan</strong> with full access to all features for 30 days. 
                          We'll send you information about upgrading before your trial expires.
                      </p>
                  </div>
              </div>
              
              <!-- Footer -->
              <div style="background-color: #1f2937; padding: 30px 20px; text-align: center;">
                  <h3 style="color: #10b981; margin: 0 0 15px 0; font-size: 18px;">Welcome to the EduDash Pro Family! 🌟</h3>
                  <p style="color: #d1d5db; margin: 0 0 20px 0; font-size: 14px;">
                      We're excited to help transform ${schoolName}'s educational experience.
                  </p>
                  
                  <div style="margin: 20px 0;">
                      <a href="https://app.edudashpro.org.za" style="color: #10b981; text-decoration: none; margin: 0 15px;">Dashboard</a>
                      <a href="https://docs.edudashpro.org.za" style="color: #10b981; text-decoration: none; margin: 0 15px;">Help Center</a>
                      <a href="https://edudashpro.org.za" style="color: #10b981; text-decoration: none; margin: 0 15px;">Website</a>
                  </div>
                  
                  <p style="color: #9ca3af; margin: 20px 0 0 0; font-size: 12px;">
                      © 2025 EduDash Pro - Transforming Preschool Education in South Africa<br>
                      This email was sent to ${adminEmail}
                  </p>
              </div>
          </div>
      </body>
      </html>
    `;

    // Send welcome email using the send-email edge function
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: adminEmail,
        subject: `🎉 Welcome to EduDash Pro - ${schoolName} Account Activated!`,
        html: emailHTML,
        templateType: 'school_welcome',
        schoolName: schoolName,
        principalName: adminName,
        metadata: {
          schoolId: schoolId,
          tempPassword: tempPassword,
          activationDate: new Date().toISOString()
        }
      }
    });

    if (error) {
      throw new Error(`Failed to send welcome email: ${error.message}`);
    }

    return data;
  }

  /**
   * Resend welcome instructions to an approved school admin
   * Used when schools didn't receive their original welcome email or need credentials again
   */
  static async resendWelcomeInstructions(schoolId: string, reason?: string) {
    try {
      console.log('📧 [SuperAdmin] Resending welcome instructions for school:', schoolId);

      // Get school and admin details from database
      const { data: school, error: schoolError } = await supabase
        .from('preschools')
        .select('*')
        .eq('id', schoolId)
        .single();

      if (schoolError || !school) {
        throw new Error(`School not found: ${schoolError?.message || 'Invalid school ID'}`);
      }

      // Get the principal/admin user for this school
      const { data: admin, error: adminError } = await supabase
        .from('users')
        .select('*')
        .eq('preschool_id', schoolId)
        .in('role', ['principal', 'admin', 'preschool_admin'])
        .eq('is_active', true)
        .single();

      if (adminError || !admin) {
        throw new Error(`School admin not found: ${adminError?.message || 'No active principal found'}`);
      }

      // Check if school has been approved (more flexible status checking)
      if (school.onboarding_status === 'rejected' || school.subscription_status === 'suspended') {
        throw new Error('School is rejected or suspended. Cannot send welcome instructions.');
      }

      // Generate a new temporary password since the old one might be compromised
      const newTempPassword = `EduDash${Math.random().toString(36).slice(-8)}!`;
      let finalPassword = newTempPassword;
      let passwordUpdated = true;

      // Update the user's password in Supabase Auth
      const { error: passwordError } = supabaseAdmin
        ? await supabaseAdmin.auth.admin.updateUserById(
          admin.auth_user_id,
          {
            password: newTempPassword,
            user_metadata: {
              ...admin,
              password_reset_required: true,
              instructions_resent_at: new Date().toISOString(),
              resend_reason: reason || 'Admin request'
            }
          }
        )
        : { error: new Error('Service role client unavailable') as any };

      if (passwordError) {
        console.warn('⚠️ [SuperAdmin] Could not update password in Supabase Auth:', passwordError.message);
        // Generate a fallback password for the email when auth update fails
        finalPassword = `Temp${Math.random().toString(36).slice(-6)}${Date.now().toString().slice(-4)}!`;
        passwordUpdated = false;
        console.log('📧 [SuperAdmin] Using fallback password for email due to auth update failure');
      }

      // Send the welcome email with credentials
      await this.sendWelcomeInstructions({
        schoolName: school.name,
        adminName: admin.name,
        adminEmail: admin.email,
        tempPassword: finalPassword,
        schoolId: schoolId,
        isResend: true,
        resendReason: reason || 'Requested by administrator',
        passwordUpdateFailed: !passwordUpdated
      });

      // Log the action for audit purposes
      await this.logSystemAction({
        action: 'welcome_instructions_resent',
        school_id: schoolId,
        user_id: admin.id,
        reason: reason || 'Admin request',
        metadata: {
          admin_email: admin.email,
          school_name: school.name,
          password_updated: !passwordError
        },
        severity: 'low'
      });

      console.log('✅ [SuperAdmin] Welcome instructions resent successfully');

      return {
        success: true,
        message: `Welcome instructions sent to ${admin.email}`,
        admin_email: admin.email,
        password_updated: !passwordError
      };
    } catch (error) {
      console.error('❌ [SuperAdmin] Error resending welcome instructions:', error);
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  }

  /**
   * Send welcome instructions (used for both new approvals and resends)
   */
  static async sendWelcomeInstructions(emailData: {
    schoolName: string;
    adminName: string;
    adminEmail: string;
    tempPassword: string;
    schoolId: string;
    isResend?: boolean;
    resendReason?: string;
    passwordUpdateFailed?: boolean;
  }) {
    const { schoolName, adminName, adminEmail, tempPassword, schoolId, isResend = false, resendReason, passwordUpdateFailed = false } = emailData;

    // Create header content based on whether this is a resend
    const headerTitle = isResend
      ? `📧 Account Instructions - ${schoolName}`
      : `🎉 Welcome to EduDash Pro - ${schoolName}!`;

    const headerSubtitle = isResend
      ? 'Your login credentials and setup instructions'
      : 'Your school has been approved!';

    const introMessage = isResend
      ? `We're resending your EduDash Pro login instructions as requested. ${resendReason ? `Reason: ${resendReason}` : ''}`
      : `<strong>Congratulations!</strong> Your school registration for <strong>${schoolName}</strong> has been approved and your EduDash Pro account is now active. You can start managing your preschool immediately!`;

    // Password warning for resends and when password update fails
    let passwordWarning = isResend
      ? `⚠️ <strong>New Password:</strong> For security, we've generated a new temporary password. Your previous password is no longer valid.`
      : `⚠️ <strong>Important:</strong> Please change your password after your first login for security.`;
    
    // Add special warning if password update failed
    if (passwordUpdateFailed && isResend) {
      passwordWarning = `🚨 <strong>Important Notice:</strong> We encountered an issue updating your password in our system. Please use the password below to log in, then immediately contact support at support@edudashpro.org.za for assistance with securing your account.`;
    }

    // Create comprehensive welcome/instructions email template
    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${headerTitle}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, ${isResend ? '#3b82f6' : '#10b981'} 0%, ${isResend ? '#1d4ed8' : '#059669'} 100%); padding: 40px 20px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">${headerTitle}</h1>
                  <p style="color: #ffffff; margin: 15px 0 0 0; font-size: 16px; opacity: 0.9;">${headerSubtitle}</p>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 30px;">
                  <h2 style="color: ${isResend ? '#1d4ed8' : '#065f46'}; margin: 0 0 20px 0; font-size: 24px;">🏫 ${schoolName}</h2>
                  
                  <p style="color: #374151; line-height: 1.6; margin: 0 0 25px 0; font-size: 16px;">
                      Dear ${adminName},
                  </p>
                  
                  <p style="color: #374151; line-height: 1.6; margin: 0 0 25px 0; font-size: 16px;">
                      ${introMessage}
                  </p>
                  
                  <!-- Login Credentials Card -->
                  <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 12px; padding: 30px; margin: 30px 0; border: 2px solid ${isResend ? '#3b82f6' : '#10b981'};">
                      <h3 style="color: ${isResend ? '#1d4ed8' : '#065f46'}; margin: 0 0 20px 0; font-size: 20px; text-align: center;">🔑 Your Login Credentials</h3>
                      
                      <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                          <div style="margin-bottom: 15px;">
                              <span style="font-weight: 600; color: #374151; display: block; margin-bottom: 5px;">📧 Email Address:</span>
                              <span style="color: #059669; font-size: 18px; font-weight: 600; font-family: 'Courier New', monospace;">${adminEmail}</span>
                          </div>
                          
                          <div style="margin-bottom: 15px;">
                              <span style="font-weight: 600; color: #374151; display: block; margin-bottom: 5px;">🔐 ${isResend ? 'New ' : ''}Temporary Password:</span>
                              <span style="color: #dc2626; font-size: 18px; font-weight: 600; font-family: 'Courier New', monospace; background-color: #fef2f2; padding: 8px 12px; border-radius: 6px; display: inline-block;">${tempPassword}</span>
                          </div>
                          
                          <div style="background-color: ${isResend ? '#fef3c7' : '#fef3c7'}; border-left: 4px solid #f59e0b; padding: 15px; margin-top: 20px; border-radius: 6px;">
                              <p style="margin: 0; color: #92400e; font-size: 14px;">${passwordWarning}</p>
                          </div>
                      </div>
                      
                      <!-- Login Button -->
                      <div style="text-align: center;">
                          <a href="https://app.edudashpro.org.za/login" style="display: inline-block; background: linear-gradient(135deg, ${isResend ? '#3b82f6' : '#10b981'} 0%, ${isResend ? '#1d4ed8' : '#059669'} 100%); color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                              🚀 ${isResend ? 'Access' : 'Login to'} Your Dashboard
                          </a>
                      </div>
                  </div>
                  
                  <!-- Getting Started Guide -->
                  <div style="background-color: #f8fafc; border-radius: 12px; padding: 30px; margin: 30px 0; border-left: 4px solid #6366f1;">
                      <h3 style="color: #4338ca; margin: 0 0 20px 0; font-size: 20px;">🎯 ${isResend ? 'Setup Reminder' : 'Getting Started'} - Your Next Steps</h3>
                      
                      <div style="margin-bottom: 15px;">
                          <strong style="color: #4338ca;">1. Complete Your Profile</strong>
                          <p style="margin: 5px 0 0 0; color: #4b5563; font-size: 14px;">Add your school logo, contact information, and preferences.</p>
                      </div>
                      
                      <div style="margin-bottom: 15px;">
                          <strong style="color: #4338ca;">2. Set Up Classes & Age Groups</strong>
                          <p style="margin: 5px 0 0 0; color: #4b5563; font-size: 14px;">Create your class structure and define age groups for your students.</p>
                      </div>
                      
                      <div style="margin-bottom: 15px;">
                          <strong style="color: #4338ca;">3. Invite Teachers & Staff</strong>
                          <p style="margin: 5px 0 0 0; color: #4b5563; font-size: 14px;">Send invitations to your teaching staff to join the platform.</p>
                      </div>
                      
                      <div style="margin-bottom: 15px;">
                          <strong style="color: #4338ca;">4. Register Students</strong>
                          <p style="margin: 5px 0 0 0; color: #4b5563; font-size: 14px;">Add your students and connect them with their parents.</p>
                      </div>
                      
                      <div>
                          <strong style="color: #4338ca;">5. Start Creating Learning Content</strong>
                          <p style="margin: 5px 0 0 0; color: #4b5563; font-size: 14px;">Begin adding lessons, activities, and educational materials.</p>
                      </div>
                  </div>
                  
                  <!-- Support Information -->
                  <div style="background-color: #eff6ff; border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #3b82f6;">
                      <h3 style="color: #1d4ed8; margin: 0 0 15px 0; font-size: 18px;">💪 Need Help${isResend ? ' Again' : ''}?</h3>
                      
                      <p style="color: #1e40af; margin: 0 0 15px 0; font-size: 14px;">Our support team is here to help you${isResend ? ' resolve any issues' : ' every step of the way'}:</p>
                      
                      <div style="margin-bottom: 10px;">
                          <span style="color: #1d4ed8; font-weight: 600;">📧 Email:</span>
                          <a href="mailto:support@edudashpro.org.za" style="color: #2563eb; margin-left: 8px;">support@edudashpro.org.za</a>
                      </div>
                      
                      <div style="margin-bottom: 10px;">
                          <span style="color: #1d4ed8; font-weight: 600;">📞 Phone:</span>
                          <span style="color: #1e40af; margin-left: 8px;">+27 11 234 5678</span>
                      </div>
                      
                      <div>
                          <span style="color: #1d4ed8; font-weight: 600;">🕒 Hours:</span>
                          <span style="color: #1e40af; margin-left: 8px;">Monday - Friday, 8:00 AM - 6:00 PM SAST</span>
                      </div>
                  </div>
                  
                  ${isResend ? '' : `
                  <!-- Subscription Info -->
                  <div style="background-color: #f0fdf4; border-radius: 12px; padding: 25px; margin: 30px 0; border: 1px solid #22c55e;">
                      <h3 style="color: #15803d; margin: 0 0 15px 0; font-size: 18px;">🎁 Your Trial Subscription</h3>
                      <p style="color: #16a34a; margin: 0; font-size: 14px;">
                          You're currently on our <strong>Trial Plan</strong> with full access to all features for 30 days. 
                          We'll send you information about upgrading before your trial expires.
                      </p>
                  </div>
                  `}
              </div>
              
              <!-- Footer -->
              <div style="background-color: #1f2937; padding: 30px 20px; text-align: center;">
                  <h3 style="color: ${isResend ? '#3b82f6' : '#10b981'}; margin: 0 0 15px 0; font-size: 18px;">${isResend ? 'Instructions Resent Successfully! 📧' : 'Welcome to the EduDash Pro Family! 🌟'}</h3>
                  <p style="color: #d1d5db; margin: 0 0 20px 0; font-size: 14px;">
                      ${isResend
        ? `If you continue to experience issues, please contact our support team.`
        : `We're excited to help transform ${schoolName}'s educational experience.`
      }
                  </p>
                  
                  <div style="margin: 20px 0;">
                      <a href="https://app.edudashpro.org.za" style="color: ${isResend ? '#3b82f6' : '#10b981'}; text-decoration: none; margin: 0 15px;">Dashboard</a>
                      <a href="https://docs.edudashpro.org.za" style="color: ${isResend ? '#3b82f6' : '#10b981'}; text-decoration: none; margin: 0 15px;">Help Center</a>
                      <a href="https://edudashpro.org.za" style="color: ${isResend ? '#3b82f6' : '#10b981'}; text-decoration: none; margin: 0 15px;">Website</a>
                  </div>
                  
                  <p style="color: #9ca3af; margin: 20px 0 0 0; font-size: 12px;">
                      © 2025 EduDash Pro - Transforming Preschool Education in South Africa<br>
                      This email was sent to ${adminEmail}
                  </p>
              </div>
          </div>
      </body>
      </html>
    `;

    // Send email using the send-email edge function
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: adminEmail,
        subject: isResend
          ? `📧 Login Instructions - ${schoolName} | EduDash Pro`
          : `🎉 Welcome to EduDash Pro - ${schoolName} Account Activated!`,
        html: emailHTML,
        templateType: isResend ? 'instructions_resend' : 'school_welcome',
        schoolName: schoolName,
        principalName: adminName,
        metadata: {
          schoolId: schoolId,
          tempPassword: tempPassword,
          isResend: isResend,
          resendReason: resendReason,
          sentAt: new Date().toISOString()
        }
      }
    });

    if (error) {
      throw new Error(`Failed to send welcome instructions: ${error.message}`);
    }

    return data;
  }

  /**
   * Advanced Super Admin Analytics and Management
   */

  // Get comprehensive user analytics
  static async getUserAnalytics(timeframe: 'week' | 'month' | 'quarter' = 'month') {
    try {
      const daysBack = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 90;
      const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();

      // New user registrations over time
      const { data: newUsers } = await supabase
        .from('users')
        .select('created_at, role')
        .gte('created_at', startDate)
        .order('created_at', { ascending: true });

      // User activity metrics
      const { data: activeUsers } = await supabase
        .from('users')
        .select('updated_at, role, preschool_id')
        .gte('updated_at', startDate)
        .eq('is_active', true);

      return {
        new_registrations: newUsers || [],
        active_users: activeUsers || [],
        registration_trend: this.calculateTrend(newUsers || []),
        activity_by_role: this.groupByRole(activeUsers || [])
      };
    } catch (error) {
      console.error('❌ [SuperAdmin] Error fetching user analytics:', error);
      return null;
    }
  }

  // Get revenue and subscription analytics
  static async getRevenueAnalytics() {
    try {
      // Get subscription distribution
      const { data: subscriptions } = await supabase
        .from('preschools')
        .select('subscription_plan, subscription_status, created_at');

      // Get payment data if available
      const { data: payments } = await supabase
        .from('payments')
        .select('amount, status, paid_at, preschool_id')
        .eq('status', 'completed');

      const planPricing = {
        trial: 0,
        basic: 299,
        premium: 599,
        enterprise: 1299
      };

      let totalRevenue = 0;
      let monthlyRecurringRevenue = 0;

      if (payments) {
        totalRevenue = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
      }

      if (subscriptions) {
        monthlyRecurringRevenue = subscriptions
          .filter(s => s.subscription_status === 'active')
          .reduce((sum, sub) => sum + (planPricing[sub.subscription_plan as keyof typeof planPricing] || 0), 0);
      }

      return {
        total_revenue: totalRevenue,
        monthly_recurring_revenue: monthlyRecurringRevenue,
        subscription_distribution: this.groupByPlan(subscriptions || []),
        payment_history: payments || []
      };
    } catch (error) {
      console.error('❌ [SuperAdmin] Error fetching revenue analytics:', error);
      return null;
    }
  }

  // Get platform usage analytics
  static async getPlatformUsage() {
    try {
      // Get lesson creation activity
      const { count: totalLessons } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true });

      // Get student enrollment trends
      const { data: enrollments } = await supabase
        .from('students')
        .select('created_at, preschool_id, is_active')
        .order('created_at', { ascending: false })
        .limit(1000);

      // Get message activity
      const { count: totalMessages } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      return {
        total_lessons: totalLessons || 0,
        enrollment_trends: this.calculateEnrollmentTrends(enrollments || []),
        monthly_messages: totalMessages || 0,
        platform_engagement: this.calculateEngagementScore(enrollments || [])
      };
    } catch (error) {
      console.error('❌ [SuperAdmin] Error fetching platform usage:', error);
      return null;
    }
  }

  // Activate/Deactivate user accounts
  static async toggleUserStatus(userId: string, isActive: boolean, reason: string) {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      // Log the action
      const action = isActive ? 'activated' : 'deactivated';

      // Log to system logs
      await this.logSystemAction({
        action: `user_${action}`,
        user_id: userId,
        reason,
        severity: 'medium'
      });

      return { success: true };
    } catch (error) {
      console.error(`❌ [SuperAdmin] Error toggling user status:`, error);
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  }

  // Change school subscription plan
  static async updateSchoolSubscription(schoolId: string, newPlan: string, reason: string) {
    try {
      const { error } = await supabase
        .from('preschools')
        .update({
          subscription_plan: newPlan,
          updated_at: new Date().toISOString()
        })
        .eq('id', schoolId);

      if (error) throw error;

      await this.logSystemAction({
        action: 'subscription_updated',
        school_id: schoolId,
        metadata: { new_plan: newPlan, reason },
        severity: 'low'
      });

      return { success: true };
    } catch (error) {
      console.error('❌ [SuperAdmin] Error updating subscription:', error);
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  }

  // Get detailed school insights
  static async getSchoolInsights(schoolId: string) {
    try {
      const [school, users, students, messages, lessons] = await Promise.all([
        supabase.from('preschools').select('*').eq('id', schoolId).single(),
        supabase.from('users').select('*').eq('preschool_id', schoolId),
        supabase.from('students').select('*').eq('preschool_id', schoolId),
        supabase.from('messages').select('*').eq('preschool_id', schoolId).limit(100),
        supabase.from('lessons').select('*').eq('preschool_id', schoolId).limit(50)
      ]);

      return {
        school: school.data,
        user_breakdown: this.analyzeUsers(users.data || []),
        student_metrics: this.analyzeStudents(students.data || []),
        engagement_data: this.analyzeEngagement(messages.data || []),
        content_creation: this.analyzeContent(lessons.data || [])
      };
    } catch (error) {
      console.error('❌ [SuperAdmin] Error fetching school insights:', error);
      return null;
    }
  }

  // System action logging
  static async logSystemAction(action: {
    action: string;
    user_id?: string;
    school_id?: string;
    reason?: string;
    metadata?: any;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }) {
    try {
      await supabase.from('system_logs').insert({
        log_type: 'admin_action',
        severity: action.severity,
        message: `${action.action}: ${action.reason || 'No reason provided'}`,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ [SuperAdmin] Error logging system action:', error);
    }
  }

  /**
   * Helper methods for analytics
   */
  static calculateTrend(data: any[]) {
    if (data.length < 2) return 0;
    const recent = data.slice(-7);
    const previous = data.slice(-14, -7);
    if (previous.length === 0) return 0;
    return ((recent.length - previous.length) / previous.length) * 100;
  }

  static groupByRole(users: any[]) {
    return users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});
  }

  static groupByPlan(subscriptions: any[]) {
    return subscriptions.reduce((acc, sub) => {
      acc[sub.subscription_plan] = (acc[sub.subscription_plan] || 0) + 1;
      return acc;
    }, {});
  }

  static calculateEnrollmentTrends(enrollments: any[]) {
    const monthly = enrollments.reduce((acc, enrollment) => {
      const month = new Date(enrollment.created_at).toISOString().substring(0, 7);
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});
    return monthly;
  }

  static calculateEngagementScore(data: any[]) {
    return Math.round((data.filter(d => d.is_active).length / Math.max(data.length, 1)) * 100);
  }

  static analyzeUsers(users: any[]) {
    const active = users.filter(u => u.is_active).length;
    const byRole = this.groupByRole(users);
    return { total: users.length, active, by_role: byRole };
  }

  static analyzeStudents(students: any[]) {
    const active = students.filter(s => s.is_active).length;
    const ageGroups = students.reduce((acc, student) => {
      const age = new Date().getFullYear() - new Date(student.date_of_birth).getFullYear();
      const group = age < 3 ? 'toddler' : age < 5 ? 'preschool' : 'kindergarten';
      acc[group] = (acc[group] || 0) + 1;
      return acc;
    }, {});
    return { total: students.length, active, age_groups: ageGroups };
  }

  static analyzeEngagement(messages: any[]) {
    const thisMonth = messages.filter(m =>
      new Date(m.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length;
    return { total_messages: messages.length, monthly_messages: thisMonth };
  }

  static analyzeContent(lessons: any[]) {
    const categories = lessons.reduce((acc, lesson) => {
      const cat = lesson.category_id || 'uncategorized';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});
    return { total_lessons: lessons.length, by_category: categories };
  }
}
