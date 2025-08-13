/**
 * Super Admin Data Service
 * Handles all super admin operations for EduDash Pro SaaS platform
 * Platform-wide control, monitoring, and management
 */

import { supabase } from '@/lib/supabase';
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
      console.log('🔱 [SuperAdmin] Fetching platform dashboard data');

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
      const { data: users, error } = await supabase
        .from('users')
        .select(`
          *,
          preschools (
            name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error || !users) {
        console.error('❌ [SuperAdmin] Error fetching users:', error);
        return [];
      }

      const enhancedUsers: UserOverview[] = users.map((user: any) => ({
        ...user,
        school_name: user.preschools?.name || null,
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
        .select(`
          id, name, role, created_at,
          preschools(name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentUsers) {
        recentUsers.forEach(user => {
          activities.push({
            id: `user-${user.id}`,
            type: 'user_registration',
            title: 'New User Registration',
            description: `${user.name} (${user.role}) joined ${user.preschools?.name || 'the platform'}`,
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
      console.log(`🔱 [SuperAdmin] School ${schoolId} suspended. Reason: ${reason}`);
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

      console.log(`🔱 [SuperAdmin] User ${userId} suspended. Reason: ${reason}`);
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
      // Create school using the database function
      const { data, error } = await supabase
        .rpc('create_tenant_with_admin', {
          p_name: schoolData.name,
          p_email: schoolData.email,
          p_admin_name: schoolData.admin_name,
          p_tenant_slug: schoolData.name.toLowerCase().replace(/\s+/g, '-'),
          p_subscription_plan: schoolData.subscription_plan || 'basic'
        });

      if (error) throw error;

      console.log(`🔱 [SuperAdmin] Created school: ${schoolData.name}`);
      return { success: true, school_id: data };
    } catch (error) {
      console.error('❌ [SuperAdmin] Error creating school:', error);
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
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
      console.log(`🔱 [SuperAdmin] User ${userId} ${action}. Reason: ${reason}`);
      
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

      console.log(`🔱 [SuperAdmin] School ${schoolId} subscription updated to ${newPlan}`);
      
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
