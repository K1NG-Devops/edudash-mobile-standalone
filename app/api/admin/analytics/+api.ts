import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionService } from '@/lib/services/subscriptionService';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is superadmin or admin
    const userRole = session.user.user_metadata?.role;
    if (!userRole || !['superadmin', 'admin'].includes(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('start_date');
    const endDateParam = searchParams.get('end_date');
    const trendsMonths = parseInt(searchParams.get('trends_months') || '12');

    // Parse date range if provided
    let dateRange: { start: Date; end: Date } | undefined;
    if (startDateParam && endDateParam) {
      dateRange = {
        start: new Date(startDateParam),
        end: new Date(endDateParam)
      };
    }

    // Get subscription analytics
    const analytics = await SubscriptionService.getSubscriptionAnalytics(dateRange);
    if (!analytics) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch analytics' },
        { status: 500 }
      );
    }

    // Get revenue trends
    const trends = await SubscriptionService.getRevenueTrends(trendsMonths);

    // Calculate additional metrics
    const totalRevenue = analytics.monthly_recurring_revenue;
    const projectedAnnualRevenue = totalRevenue * 12;
    const averageRevenuePerUser = analytics.average_revenue_per_user;
    
    // Growth rate calculation (simplified - comparing current month to previous)
    let growthRate = 0;
    if (trends.length >= 2) {
      const currentMonth = trends[trends.length - 1];
      const previousMonth = trends[trends.length - 2];
      if (previousMonth.revenue > 0) {
        growthRate = ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100;
      }
    }

    // Response with comprehensive analytics
    return NextResponse.json({
      success: true,
      data: {
        // Core subscription metrics
        subscriptions: {
          total: analytics.total_subscribers,
          active: analytics.active_subscriptions,
          trial: analytics.trial_subscriptions,
          canceled: analytics.canceled_subscriptions,
          conversion_rate: analytics.conversion_rate
        },
        
        // Revenue metrics
        revenue: {
          monthly_recurring: analytics.monthly_recurring_revenue,
          annual_recurring: analytics.annual_recurring_revenue,
          projected_annual: projectedAnnualRevenue,
          average_per_user: averageRevenuePerUser,
          growth_rate: Math.round(growthRate * 100) / 100
        },
        
        // Plan breakdown
        plans: {
          subscriber_counts: analytics.subscriber_breakdown,
          revenue_breakdown: analytics.revenue_by_plan
        },
        
        // Business health metrics
        health: {
          churn_rate: analytics.churn_rate,
          conversion_rate: analytics.conversion_rate,
          total_customers: analytics.total_subscribers
        },
        
        // Recent activity
        recent_transactions: analytics.recent_transactions,
        
        // Revenue trends over time
        trends: trends.map(trend => ({
          ...trend,
          revenue: Math.round(trend.revenue * 100) / 100
        })),
        
        // Metadata
        generated_at: new Date().toISOString(),
        date_range: dateRange ? {
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString()
        } : null,
        trends_period_months: trendsMonths
      }
    });

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST endpoint for manual analytics refresh or custom queries
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userRole = session.user.user_metadata?.role;
    if (!userRole || !['superadmin', 'admin'].includes(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, params } = body;

    switch (action) {
      case 'refresh_analytics':
        // Force refresh of analytics (could trigger background job)
        const analytics = await SubscriptionService.getSubscriptionAnalytics();
        return NextResponse.json({
          success: true,
          data: analytics,
          refreshed_at: new Date().toISOString()
        });

      case 'custom_date_range':
        const { start_date, end_date } = params;
        if (!start_date || !end_date) {
          return NextResponse.json(
            { success: false, error: 'start_date and end_date required for custom range' },
            { status: 400 }
          );
        }
        
        const customAnalytics = await SubscriptionService.getSubscriptionAnalytics({
          start: new Date(start_date),
          end: new Date(end_date)
        });
        
        return NextResponse.json({
          success: true,
          data: customAnalytics,
          date_range: { start_date, end_date }
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Unknown action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Analytics POST API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
