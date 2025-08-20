import { IconSymbol } from '@/components/ui/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: screenWidth } = Dimensions.get('window');

interface AnalyticsData {
  enrollment: {
    total: number;
    thisMonth: number;
    trend: 'up' | 'down' | 'stable';
  };
  attendance: {
    rate: number;
    trend: 'up' | 'down' | 'stable';
  };
  revenue: {
    monthly: number;
    yearly: number;
    trend: 'up' | 'down' | 'stable';
  };
  satisfaction: {
    score: number;
    responses: number;
  };
}

export default function AnalyticsScreen() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    enrollment: { total: 0, thisMonth: 0, trend: 'stable' },
    attendance: { rate: 0, trend: 'stable' },
    revenue: { monthly: 0, yearly: 0, trend: 'stable' },
    satisfaction: { score: 0, responses: 0 },
  });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Mock analytics data - in real app, fetch from Supabase
      const mockData: AnalyticsData = {
        enrollment: {
          total: 156,
          thisMonth: 12,
          trend: 'up',
        },
        attendance: {
          rate: 92.5,
          trend: 'up',
        },
        revenue: {
          monthly: 85400,
          yearly: 980000,
          trend: 'up',
        },
        satisfaction: {
          score: 4.7,
          responses: 89,
        },
      };

      setAnalytics(mockData);
    } catch (error) {
      // Removed debug statement: console.error('Error loading analytics:', error);
      Alert.alert('Error', 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'arrow.up.right';
      case 'down': return 'arrow.down.right';
      case 'stable': return 'minus';
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return '#10B981';
      case 'down': return '#EF4444';
      case 'stable': return '#6B7280';
    }
  };

  const MetricCard = ({ 
    title, 
    value, 
    subtitle, 
    trend, 
    icon, 
    color 
  }: {
    title: string;
    value: string;
    subtitle: string;
    trend: 'up' | 'down' | 'stable';
    icon: any;
    color: string;
  }) => (
    <View style={styles.metricCard}>
      <LinearGradient
        colors={[`${color}15`, `${color}05`]}
        style={styles.metricGradient}
      >
        <View style={styles.metricHeader}>
          <View style={[styles.metricIcon, { backgroundColor: color }]}>
            <IconSymbol name={icon} size={20} color="#FFFFFF" />
          </View>
          <View style={[styles.trendContainer, { backgroundColor: getTrendColor(trend) }]}>
            <IconSymbol name={getTrendIcon(trend) as any} size={12} color="#FFFFFF" />
          </View>
        </View>
        <Text style={styles.metricValue}>{value}</Text>
        <Text style={styles.metricTitle}>{title}</Text>
        <Text style={styles.metricSubtitle}>{subtitle}</Text>
      </LinearGradient>
    </View>
  );

  const PeriodButton = ({ period, label }: { period: 'week' | 'month' | 'year'; label: string }) => (
    <TouchableOpacity
      style={[
        styles.periodButton,
        selectedPeriod === period && styles.periodButtonActive
      ]}
      onPress={() => setSelectedPeriod(period)}
    >
      <Text style={[
        styles.periodText,
        selectedPeriod === period && styles.periodTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Analytics Dashboard</Text>
          <Text style={styles.subtitle}>School performance insights</Text>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <PeriodButton period="week" label="Week" />
          <PeriodButton period="month" label="Month" />
          <PeriodButton period="year" label="Year" />
        </View>

        {/* Key Metrics */}
        <View style={styles.metricsSection}>
          <Text style={styles.sectionTitle}>📊 Key Metrics</Text>
          <View style={styles.metricsGrid}>
            <MetricCard
              title="Total Enrollment"
              value={analytics.enrollment.total.toString()}
              subtitle={`+${analytics.enrollment.thisMonth} this month`}
              trend={analytics.enrollment.trend}
              icon="person.3.fill"
              color="#3B82F6"
            />
            <MetricCard
              title="Attendance Rate"
              value={`${analytics.attendance.rate}%`}
              subtitle="Daily average"
              trend={analytics.attendance.trend}
              icon="checkmark.circle.fill"
              color="#10B981"
            />
            <MetricCard
              title="Monthly Revenue"
              value={`R${(analytics.revenue.monthly / 1000).toFixed(0)}k`}
              subtitle={`R${(analytics.revenue.yearly / 1000).toFixed(0)}k yearly`}
              trend={analytics.revenue.trend}
              icon="dollarsign.circle.fill"
              color="#F59E0B"
            />
            <MetricCard
              title="Satisfaction"
              value={`${analytics.satisfaction.score}/5`}
              subtitle={`${analytics.satisfaction.responses} responses`}
              trend="up"
              icon="heart.fill"
              color="#EF4444"
            />
          </View>
        </View>

        {/* Charts Section */}
        <View style={styles.chartsSection}>
          <Text style={styles.sectionTitle}>📈 Trends</Text>
          
          {/* Enrollment Trend */}
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Enrollment Trend</Text>
              <Text style={styles.chartSubtitle}>Last 6 months</Text>
            </View>
            <View style={styles.chartPlaceholder}>
              <IconSymbol name="chart.line.uptrend.xyaxis" size={48} color="#6B7280" />
              <Text style={styles.chartPlaceholderText}>Chart visualization</Text>
            </View>
          </View>

          {/* Revenue Breakdown */}
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Revenue Breakdown</Text>
              <Text style={styles.chartSubtitle}>By payment type</Text>
            </View>
            <View style={styles.revenueBreakdown}>
              <View style={styles.revenueItem}>
                <View style={[styles.revenueColor, { backgroundColor: '#3B82F6' }]} />
                <Text style={styles.revenueLabel}>Monthly Fees</Text>
                <Text style={styles.revenueValue}>65%</Text>
              </View>
              <View style={styles.revenueItem}>
                <View style={[styles.revenueColor, { backgroundColor: '#10B981' }]} />
                <Text style={styles.revenueLabel}>Registration</Text>
                <Text style={styles.revenueValue}>20%</Text>
              </View>
              <View style={styles.revenueItem}>
                <View style={[styles.revenueColor, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.revenueLabel}>Activities</Text>
                <Text style={styles.revenueValue}>15%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>⚡ Quick Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>23</Text>
              <Text style={styles.statLabel}>New Students</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>8</Text>
              <Text style={styles.statLabel}>Active Teachers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>94%</Text>
              <Text style={styles.statLabel}>Payment Rate</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>4.8</Text>
              <Text style={styles.statLabel}>App Rating</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
  },
  periodButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 5,
    backgroundColor: '#F3F4F6',
  },
  periodButtonActive: {
    backgroundColor: '#3B82F6',
  },
  periodText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  periodTextActive: {
    color: '#FFFFFF',
  },
  metricsSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 15,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: (screenWidth - 60) / 2,
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  metricGradient: {
    padding: 15,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  metricIcon: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  metricSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  chartsSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginTop: 10,
  },
  chartCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  chartHeader: {
    marginBottom: 15,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  chartSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  chartPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  chartPlaceholderText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 10,
  },
  revenueBreakdown: {
    gap: 10,
  },
  revenueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  revenueColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  revenueLabel: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  revenueValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  statsSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginTop: 10,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: (screenWidth - 80) / 4,
    alignItems: 'center',
    paddingVertical: 15,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});
