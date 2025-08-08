/**
 * Super Admin Data Service
 * Handles all super admin operations for EduDash Pro SaaS platform
 * Platform-wide control, monitoring, and management
 */

import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';

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

      return user.role === 'superadmin' && user.is_active;
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

      // Calculate subscription stats
      const { data: subscriptions } = await supabase
        .from('preschools')
        .select('subscription_status, subscription_plan');

      const activeSubscriptions = subscriptions?.filter(s => s.subscription_status === 'active').length || 0;
      
      // Mock data for revenue (would integrate with payment system)
      const monthlyRevenue = activeSubscriptions * 750; // Assuming average R750/month
      const growthRate = 12.5; // Mock 12.5% growth rate

      return {
        total_schools: schoolCount || 0,
        total_users: userCounts.total || 0,
        total_students: studentCount || 0,
        total_teachers: userCounts.teacher || 0,
        total_parents: userCounts.parent || 0,
        active_subscriptions: activeSubscriptions,
        monthly_revenue: monthlyRevenue,
        growth_rate: growthRate,
        ai_usage_count: Math.floor(Math.random() * 10000), // Mock AI usage
        storage_usage_gb: Math.floor(Math.random() * 500) + 100 // Mock storage
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

      // Enhance each school with user counts and activity data
      const enhancedSchools = await Promise.all(
        schools.map(async (school) => {
          const [userCount, studentCount] = await Promise.all([
            this.getSchoolUserCount(school.id),
            this.getSchoolStudentCount(school.id)
          ]);

          const teachers = Math.floor(userCount.total * 0.1); // Assume 10% are teachers
          const parents = userCount.total - teachers;

          const enhanced: SchoolOverview = {
            ...school,
            user_count: userCount.total,
            student_count: studentCount,
            teacher_count: teachers,
            parent_count: parents,
            last_activity: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(), // Mock last activity
            subscription_status: school.subscription_status as any || 'active',
            monthly_fee: 750, // Mock monthly fee in Rands
            ai_usage: Math.floor(Math.random() * 100),
            storage_usage: Math.floor(Math.random() * 10) + 1
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
        last_login: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(), // Mock last login
        is_suspended: false,
        subscription_status: 'active',
        total_students: user.role === 'parent' ? Math.floor(Math.random() * 3) + 1 : 0,
        account_status: user.is_active ? 'active' : 'inactive'
      }));

      return enhancedUsers;
    } catch (error) {
      console.error('❌ [SuperAdmin] Error fetching recent users:', error);
      return [];
    }
  }

  /**
   * Get platform activity feed
   */
  static async getPlatformActivity(): Promise<PlatformActivity[]> {
    // Mock platform activity - in real implementation would aggregate from various tables
    const activities: PlatformActivity[] = [
      {
        id: '1',
        type: 'school_created',
        title: 'New School Registration',
        description: 'Sunshine Preschool registered on the platform',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        school_id: 'school-1',
        severity: 'low'
      },
      {
        id: '2',
        type: 'payment_received',
        title: 'Payment Processed',
        description: 'R750 monthly subscription payment from Happy Kids Academy',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        school_id: 'school-2',
        severity: 'low'
      },
      {
        id: '3',
        type: 'ai_usage',
        title: 'AI Usage Spike',
        description: 'AI lesson generation usage increased by 150% this week',
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        severity: 'medium'
      },
      {
        id: '4',
        type: 'security_alert',
        title: 'Failed Login Attempts',
        description: '15 failed login attempts detected from IP 192.168.1.100',
        timestamp: new Date(Date.now() - 14400000).toISOString(),
        severity: 'high'
      },
      {
        id: '5',
        type: 'user_registration',
        title: 'Bulk User Registrations',
        description: '25 new parent accounts created at Little Learners Academy',
        timestamp: new Date(Date.now() - 18000000).toISOString(),
        user_id: 'user-1',
        school_id: 'school-3',
        severity: 'low'
      }
    ];

    return activities;
  }

  /**
   * Get system health metrics
   */
  static async getSystemHealth(): Promise<SystemHealth> {
    // Mock system health data - would integrate with monitoring tools
    return {
      database_status: 'healthy',
      api_response_time: Math.floor(Math.random() * 200) + 50, // 50-250ms
      uptime_percentage: 99.9,
      active_connections: Math.floor(Math.random() * 500) + 100,
      storage_usage_percentage: Math.floor(Math.random() * 20) + 60, // 60-80%
      bandwidth_usage_gb: Math.floor(Math.random() * 100) + 200,
      error_rate_percentage: Math.random() * 0.5, // 0-0.5%
      last_backup: new Date(Date.now() - 3600000 * 6).toISOString() // 6 hours ago
    };
  }

  /**
   * Get pending approvals count
   */
  static async getPendingApprovals() {
    // Mock pending approvals - would query actual approval tables
    return {
      schools: Math.floor(Math.random() * 5),
      users: Math.floor(Math.random() * 15),
      content_reports: Math.floor(Math.random() * 8)
    };
  }

  /**
   * Get system alerts
   */
  static async getSystemAlerts() {
    // Mock system alerts
    const alerts = [
      {
        id: '1',
        type: 'payment_failed' as const,
        message: '3 schools have failed payment attempts this month',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        priority: 'high' as const
      },
      {
        id: '2',
        type: 'system_error' as const,
        message: 'Database connection pool approaching limit',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        priority: 'medium' as const
      }
    ];

    return alerts.filter(() => Math.random() > 0.5); // Randomly show some alerts
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
      return { success: false, error: error.message };
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
      return { success: false, error: error.message };
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
      return { success: false, error: error.message };
    }
  }
}
