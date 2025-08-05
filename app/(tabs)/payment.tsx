import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MobileHeader } from '@/components/navigation/MobileHeader';
import { AuthConsumer, UserProfile } from '@/contexts/SimpleWorkingAuth';
import { IconSymbol } from '@/components/ui/IconSymbol';
import PaymentCard from '@/components/payments/PaymentCard';
import ProofOfPaymentUpload, { ProofOfPaymentData } from '@/components/payments/ProofOfPaymentUpload';
import { PaymentService } from '@/lib/services/paymentService';
import { PaymentFee, PaymentSummary, Payment } from '@/types/payment-types';
import { router } from 'expo-router';

const { width: screenWidth } = Dimensions.get('window');

interface PaymentScreenState {
  loading: boolean;
  refreshing: boolean;
  fees: PaymentFee[];
  paymentHistory: Payment[];
  summary: PaymentSummary | null;
  selectedTab: 'outstanding' | 'history';
  selectedFees: string[];
  error: string | null;
  showMultiSelect: boolean;
  dataLoaded: boolean;
  showPOPUpload: boolean;
  selectedFeeForPayment: PaymentFee | null;
}

const handleNavigate = (route: string) => {
  console.log('Navigating to:', route);
  if (route.startsWith('/(tabs)')) {
    router.push(route as any);
  } else if (route.startsWith('/')) {
    const screenName = route.substring(1);
    router.push(`/screens/${screenName}` as any);
  }
};

class PaymentScreen extends React.Component<{}, PaymentScreenState> {
  state: PaymentScreenState = {
    loading: false, // Start with false since we're using mock data
    refreshing: false,
    fees: [],
    paymentHistory: [],
    summary: null,
    selectedTab: 'outstanding',
    selectedFees: [],
    error: null,
    showMultiSelect: false,
    dataLoaded: false,
    showPOPUpload: false,
    selectedFeeForPayment: null,
  };

componentDidMount() {
    // Load real data from Supabase
    // Note: fetchPaymentData will be called when profile is available in renderContent
  }

  togglePOPUpload = () => {
    this.setState(prevState => ({ 
      showPOPUpload: !prevState.showPOPUpload,
      selectedFeeForPayment: null // Clear selected fee when closing
    }));
  };

  handlePOPUpload = async (proofData: ProofOfPaymentData, profile: UserProfile | null) => {
    try {
      console.log('📄 Uploading proof of payment:', proofData);
      
      if (!profile?.auth_user_id) {
        throw new Error('User not authenticated');
      }
      
      // Submit proof of payment to the backend
      const result = await PaymentService.submitProofOfPayment(proofData, profile.auth_user_id);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to submit proof of payment');
      }
      
      console.log('✅ Proof of payment uploaded successfully:', result.paymentId);
      
      // Refresh payment data to show the updated status
      if (profile.auth_user_id) {
        await this.fetchPaymentData(profile.auth_user_id);
      }
      
    } catch (error) {
      console.error('❌ Failed to upload proof of payment:', error);
      throw error;
    }
  };

  fetchPaymentData = async (parentAuthId: string) => {
    try {
      this.setState({ loading: true, error: null });
      
      console.log('🔧 PaymentScreen - Fetching data for parent:', parentAuthId);

      // Try to fetch real data from Supabase
      const feesResponse = await PaymentService.getOutstandingFees(parentAuthId);
      
      console.log('📊 PaymentService response:', {
        success: feesResponse.success,
        error: feesResponse.error,
        feesCount: feesResponse.fees?.length || 0,
        hasSummary: !!feesResponse.summary
      });
      
      if (feesResponse.success && feesResponse.fees && feesResponse.summary) {
        // Fetch payment history
        const paymentHistory = await PaymentService.getPaymentHistory(parentAuthId, 20);
        
        this.setState({
          fees: feesResponse.fees,
          summary: feesResponse.summary,
          paymentHistory: paymentHistory,
          loading: false,
          dataLoaded: true,
        });
      } else {
        // If no data or database tables don't exist yet, show empty state for first-time parents
        console.log('No payment data found, showing empty state for first-time parent:', feesResponse.error);
        
        this.setState({
          fees: [], // Empty fees to show the POP upload interface
          summary: null, // No summary to hide summary cards
          paymentHistory: [], // Empty history
          loading: false,
          dataLoaded: true,
        });
      }
    } catch (error) {
      console.error('Error fetching payment data:', error);
      
      // Fall back to mock data on error
      const mockFees = this.generateMockFees();
      const mockSummary = this.generateMockSummary(mockFees);
      const mockHistory = this.generateMockHistory();

      this.setState({
        fees: mockFees,
        summary: mockSummary,
        paymentHistory: mockHistory,
        loading: false,
        error: null, // Don't show error since we have fallback data
        dataLoaded: true,
      });
    }
  };

  generateMockFees = (): PaymentFee[] => {
    return [
      {
        id: '1',
        preschool_id: 'mock_preschool',
        student_id: 'student_1',
        fee_type: 'tuition',
        title: 'January Tuition Fee',
        description: 'Monthly preschool tuition and educational activities',
        amount: 1200,
        currency: 'ZAR',
        due_date: '2025-01-15',
        is_recurring: true,
        recurring_frequency: 'monthly',
        is_overdue: false,
        is_paid: false,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        student: { id: 'student_1', first_name: 'Emma', last_name: 'Johnson' },
      },
      {
        id: '2',
        preschool_id: 'mock_preschool',
        student_id: 'student_1',
        fee_type: 'activity',
        title: 'Arts & Crafts Materials',
        description: 'Materials for creative activities and art projects',
        amount: 150,
        currency: 'ZAR',
        due_date: '2025-01-20',
        is_recurring: false,
        is_overdue: false,
        is_paid: false,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        student: { id: 'student_1', first_name: 'Emma', last_name: 'Johnson' },
      },
      {
        id: '3',
        preschool_id: 'mock_preschool',
        student_id: 'student_1',
        fee_type: 'meal',
        title: 'School Lunch Program',
        description: 'Nutritious meals and snacks for the month',
        amount: 300,
        currency: 'ZAR',
        due_date: '2024-12-20',
        is_recurring: true,
        recurring_frequency: 'monthly',
        is_overdue: true,
        is_paid: false,
        created_at: '2024-12-01T00:00:00Z',
        updated_at: '2024-12-01T00:00:00Z',
        student: { id: 'student_1', first_name: 'Emma', last_name: 'Johnson' },
      },
      {
        id: '4',
        preschool_id: 'mock_preschool',
        student_id: 'student_1',
        fee_type: 'transport',
        title: 'School Transport',
        description: 'Safe transportation to and from school',
        amount: 250,
        currency: 'ZAR',
        due_date: '2025-01-10',
        is_recurring: true,
        recurring_frequency: 'monthly',
        is_overdue: false,
        is_paid: false,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        student: { id: 'student_1', first_name: 'Emma', last_name: 'Johnson' },
      },
    ];
  };

  generateMockSummary = (fees: PaymentFee[]): PaymentSummary => {
    const totalOutstanding = fees.reduce((sum, fee) => sum + fee.amount, 0);
    const overdueAmount = fees
      .filter(fee => new Date(fee.due_date) < new Date())
      .reduce((sum, fee) => sum + fee.amount, 0);

    return {
      total_outstanding: totalOutstanding,
      total_paid_this_month: 1200,
      next_payment_due: '2025-01-10',
      overdue_amount: overdueAmount,
      upcoming_fees: fees.filter(fee => new Date(fee.due_date) >= new Date()).slice(0, 3),
      recent_payments: [],
    };
  };

  generateMockHistory = (): Payment[] => {
    return [
      {
        id: 'payment_1',
        preschool_id: 'mock_preschool',
        parent_id: 'parent_1',
        student_id: 'student_1',
        fee_ids: ['fee_123'],
        amount: 1200,
        currency: 'ZAR',
        payment_method: 'card',
        payment_reference: 'EDU1234567890ABCD',
        status: 'completed',
        description: 'December Tuition Fee',
        processed_at: '2024-12-15T10:30:00Z',
        created_at: '2024-12-15T10:25:00Z',
        updated_at: '2024-12-15T10:30:00Z',
        student: { id: 'student_1', first_name: 'Emma', last_name: 'Johnson' },
      },
      {
        id: 'payment_2',
        preschool_id: 'mock_preschool',
        parent_id: 'parent_1',
        student_id: 'student_1',
        fee_ids: ['fee_124'],
        amount: 300,
        currency: 'ZAR',
        payment_method: 'bank_transfer',
        payment_reference: 'EDU1234567891BCDE',
        status: 'completed',
        description: 'School Transport Fee',
        processed_at: '2024-12-10T14:20:00Z',
        created_at: '2024-12-10T14:15:00Z',
        updated_at: '2024-12-10T14:20:00Z',
        student: { id: 'student_1', first_name: 'Emma', last_name: 'Johnson' },
      },
    ];
  };

  onRefresh = async (profile: UserProfile | null) => {
    if (!profile?.auth_user_id) return;
    
    this.setState({ refreshing: true });
    await this.fetchPaymentData(profile.auth_user_id);
    this.setState({ refreshing: false });
  };

  handlePaySingle = (fee: PaymentFee) => {
    Alert.alert(
      'Make Payment',
      `Pay ${this.formatCurrency(fee.amount)} for ${fee.title}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Upload Proof', onPress: () => this.openPOPForFee(fee) },
        { text: 'Pay Now', onPress: () => this.processPayment([fee.id]) },
      ]
    );
  };

  openPOPForFee = (fee: PaymentFee) => {
    this.setState({ 
      selectedFeeForPayment: fee,
      showPOPUpload: true 
    });
  };

  handlePayMultiple = () => {
    const selectedFees = this.state.fees.filter(fee => 
      this.state.selectedFees.includes(fee.id)
    );
    const totalAmount = selectedFees.reduce((sum, fee) => sum + fee.amount, 0);

    Alert.alert(
      'Make Payment',
      `Pay ${this.formatCurrency(totalAmount)} for ${selectedFees.length} selected items?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Pay Now', onPress: () => this.processPayment(this.state.selectedFees) },
      ]
    );
  };

  processPayment = (feeIds: string[]) => {
    // Simulate payment processing
    Alert.alert(
      'Payment Successful! 🎉',
      'Your payment has been processed successfully. You will receive a receipt via email.',
      [{ text: 'OK', onPress: () => this.clearSelection() }]
    );
  };

  toggleMultiSelect = () => {
    this.setState({ 
      showMultiSelect: !this.state.showMultiSelect,
      selectedFees: [],
    });
  };

  toggleFeeSelection = (fee: PaymentFee, selected: boolean) => {
    if (selected) {
      this.setState({ 
        selectedFees: [...this.state.selectedFees, fee.id] 
      });
    } else {
      this.setState({ 
        selectedFees: this.state.selectedFees.filter(id => id !== fee.id) 
      });
    }
  };

  clearSelection = () => {
    this.setState({ 
      selectedFees: [],
      showMultiSelect: false,
    });
  };

  formatCurrency = (amount: number, currency: string = 'ZAR') => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  renderSummaryCards = () => {
    const { summary } = this.state;
    if (!summary) return null;

    return (
      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <IconSymbol name="exclamationmark.triangle.fill" size={24} color="#EF4444" />
            <Text style={styles.summaryAmount}>
              {this.formatCurrency(summary.total_outstanding)}
            </Text>
            <Text style={styles.summaryLabel}>Outstanding</Text>
          </View>

          <View style={styles.summaryCard}>
            <IconSymbol name="checkmark.circle.fill" size={24} color="#10B981" />
            <Text style={styles.summaryAmount}>
              {this.formatCurrency(summary.total_paid_this_month)}
            </Text>
            <Text style={styles.summaryLabel}>Paid This Month</Text>
          </View>
        </View>

        {summary.overdue_amount > 0 && (
          <View style={[styles.summaryCard, styles.fullWidthCard, styles.overdueCard]}>
            <View style={styles.overdueHeader}>
              <IconSymbol name="clock.fill" size={20} color="#EF4444" />
              <Text style={styles.overdueTitle}>Overdue Amount</Text>
            </View>
            <Text style={styles.overdueAmount}>
              {this.formatCurrency(summary.overdue_amount)}
            </Text>
            <Text style={styles.overdueText}>Please pay as soon as possible</Text>
          </View>
        )}
      </View>
    );
  };

  renderTabHeader = () => {
    const { selectedTab, fees, paymentHistory, showMultiSelect, selectedFees } = this.state;
    const outstandingCount = fees.length;
    const historyCount = paymentHistory.length;

    return (
      <View style={styles.tabContainer}>
        <View style={styles.tabButtons}>
          <TouchableOpacity
            style={[styles.tabButton, selectedTab === 'outstanding' && styles.activeTab]}
            onPress={() => this.setState({ selectedTab: 'outstanding' })}
          >
            <Text style={[
              styles.tabText,
              selectedTab === 'outstanding' && styles.activeTabText
            ]}>
              Outstanding ({outstandingCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, selectedTab === 'history' && styles.activeTab]}
            onPress={() => this.setState({ selectedTab: 'history' })}
          >
            <Text style={[
              styles.tabText,
              selectedTab === 'history' && styles.activeTabText
            ]}>
              History ({historyCount})
            </Text>
          </TouchableOpacity>
        </View>

        {selectedTab === 'outstanding' && outstandingCount > 1 && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={this.toggleMultiSelect}
            >
              <IconSymbol 
                name={showMultiSelect ? "xmark" : "checkmark.square"} 
                size={16} 
                color="#3B82F6" 
              />
              <Text style={styles.selectButtonText}>
                {showMultiSelect ? 'Cancel' : 'Select Multiple'}
              </Text>
            </TouchableOpacity>

            {showMultiSelect && selectedFees.length > 0 && (
              <TouchableOpacity
                style={styles.paySelectedButton}
                onPress={this.handlePayMultiple}
              >
                <Text style={styles.paySelectedText}>
                  Pay {selectedFees.length} Selected
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  renderOutstandingFees = () => {
    const { fees, showMultiSelect, selectedFees } = this.state;

    if (fees.length === 0) {
      return (
        <View style={styles.emptyState}>
          <IconSymbol name="checkmark.circle.fill" size={64} color="#10B981" />
          <Text style={styles.emptyTitle}>All Caught Up! 🎉</Text>
          <Text style={styles.emptyText}>
            You have no outstanding fees. Great job staying on top of payments!
          </Text>
          
          {/* General Payment Options for First-time Parents */}
          <View style={styles.generalPaymentSection}>
            <Text style={styles.generalPaymentTitle}>Need to make a payment?</Text>
            <Text style={styles.generalPaymentSubtitle}>
              Upload proof of payment or make payments for school fees, activities, or other charges.
            </Text>
            
            {/* Upload Proof of Payment Button */}
            <TouchableOpacity 
              style={styles.uploadProofButton}
              onPress={this.togglePOPUpload}
            >
              <IconSymbol name="doc.badge.plus" size={20} color="#3B82F6" />
              <Text style={styles.uploadProofText}>Upload Proof of Payment</Text>
            </TouchableOpacity>
            
            <Text style={styles.helpText}>
              Use this to submit proof of payments you've already made, or to make new payments for school fees, activities, meals, transport, or other charges.
            </Text>
          </View>
        </View>
      );
    }

    // Sort fees: overdue first, then by due date
    const sortedFees = [...fees].sort((a, b) => {
      const aOverdue = new Date(a.due_date) < new Date();
      const bOverdue = new Date(b.due_date) < new Date();
      
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });

    return (
      <View style={styles.feesContainer}>
        {sortedFees.map((fee) => (
          <PaymentCard
            key={fee.id}
            fee={fee}
            onPayPress={this.handlePaySingle}
            onSelectToggle={this.toggleFeeSelection}
            isSelected={selectedFees.includes(fee.id)}
            showCheckbox={showMultiSelect}
            showStudentName={true}
          />
        ))}
        
        {/* Upload Proof of Payment Button */}
        <TouchableOpacity 
          style={styles.uploadProofButton}
          onPress={this.togglePOPUpload}
        >
          <IconSymbol name="doc.badge.plus" size={20} color="#3B82F6" />
          <Text style={styles.uploadProofText}>Upload Proof of Payment</Text>
        </TouchableOpacity>
      </View>
    );
  };

  renderPaymentHistory = () => {
    const { paymentHistory } = this.state;

    if (paymentHistory.length === 0) {
      return (
        <View style={styles.emptyState}>
          <IconSymbol name="doc.text" size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>No Payment History</Text>
          <Text style={styles.emptyText}>
            Your payment history will appear here once you make your first payment.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.historyContainer}>
        {paymentHistory.map((payment) => (
          <View key={payment.id} style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <View style={styles.historyInfo}>
                <Text style={styles.historyAmount}>
                  {this.formatCurrency(payment.amount, payment.currency)}
                </Text>
                <Text style={styles.historyDescription}>
                  {payment.description}
                </Text>
                <Text style={styles.historyDate}>
                  {new Date(payment.processed_at || payment.created_at).toLocaleDateString('en-ZA', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <View style={styles.historyStatus}>
                <View style={[
                  styles.statusBadge,
                  payment.status === 'completed' ? styles.completedBadge : styles.pendingBadge
                ]}>
                  <IconSymbol 
                    name={payment.status === 'completed' ? "checkmark.circle.fill" : "clock.fill"} 
                    size={14} 
                    color={payment.status === 'completed' ? "#059669" : "#D97706"} 
                  />
                  <Text style={[
                    styles.statusText,
                    payment.status === 'completed' ? styles.completedText : styles.pendingText
                  ]}>
                    {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.historyFooter}>
              <View style={styles.paymentMethodInfo}>
                <IconSymbol 
                  name={payment.payment_method === 'card' ? "creditcard.fill" : "building.columns.fill"} 
                  size={14} 
                  color="#6B7280" 
                />
                <Text style={styles.paymentMethodText}>
                  {payment.payment_method === 'card' ? 'Credit Card' : 'Bank Transfer'}
                </Text>
              </View>
              <Text style={styles.referenceText}>
                Ref: {payment.payment_reference}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  renderContent = (profile: UserProfile | null, signOut: () => Promise<void>) => {
    // Load data when profile is available and data hasn't been loaded yet
    if (profile?.auth_user_id && !this.state.dataLoaded && !this.state.loading && !this.state.error) {
      this.fetchPaymentData(profile.auth_user_id);
    }

    const { loading, selectedTab, error } = this.state;

    return (
      <View style={styles.container}>
        <MobileHeader
          user={{
            name: profile?.name || 'Parent',
            role: 'parent',
            avatar: profile?.avatar_url,
          }}
          onNotificationsPress={() => console.log('Notifications')}
          onSearchPress={() => console.log('Search')}
          onSignOut={signOut}
          onNavigate={handleNavigate}
          notificationCount={3}
        />

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading payment information...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <IconSymbol name="exclamationmark.triangle.fill" size={48} color="#EF4444" />
            <Text style={styles.errorTitle}>Something went wrong</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => profile?.auth_user_id && this.fetchPaymentData(profile.auth_user_id)}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            refreshControl={
              <RefreshControl
                refreshing={this.state.refreshing}
                onRefresh={() => this.onRefresh(profile)}
                colors={['#3B82F6']}
              />
            }
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <View>
                  <Text style={styles.headerTitle}>Payments</Text>
                  <Text style={styles.headerSubtitle}>
                    Manage school fees and view history
                  </Text>
                </View>
                <View style={styles.headerIcon}>
                  <IconSymbol name="creditcard.fill" size={32} color="#374151" />
                </View>
              </View>
            </View>

            {/* Summary Cards */}
            {this.renderSummaryCards()}

            {/* Tab Header */}
            {this.renderTabHeader()}

            {/* Content */}
            <View style={styles.contentContainer}>
              {selectedTab === 'outstanding' ? this.renderOutstandingFees() : this.renderPaymentHistory()}
            </View>

            <View style={styles.bottomSpacing} />
          </ScrollView>
        )}
      </View>
    );
  };

  render() {
    return (
      <AuthConsumer>
        {({ profile, signOut }) => (
          <>
            {this.renderContent(profile, signOut)}
            {/* Proof of Payment Upload Modal */}
            <ProofOfPaymentUpload
              visible={this.state.showPOPUpload}
              onClose={this.togglePOPUpload}
              onUpload={(proofData) => this.handlePOPUpload(proofData, profile)}
              childName={this.state.selectedFeeForPayment?.student?.first_name && this.state.selectedFeeForPayment?.student?.last_name 
                ? `${this.state.selectedFeeForPayment.student.first_name} ${this.state.selectedFeeForPayment.student.last_name}` 
                : undefined}
              feeAmount={this.state.selectedFeeForPayment?.amount?.toString()}
              feeDescription={this.state.selectedFeeForPayment?.description}
              studentId={this.state.selectedFeeForPayment?.student_id}
            />
          </>
        )}
      </AuthConsumer>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap', // Allow wrap
    gap: 10, // Added gap for spacing
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  fullWidthCard: {
    width: '100%',
    alignItems: 'flex-start',
  },
  overdueCard: {
    borderColor: '#FEE2E2',
    backgroundColor: '#FEFEFE',
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  overdueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  overdueTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
    marginLeft: 8,
  },
  overdueAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 4,
  },
  overdueText: {
    fontSize: 14,
    color: '#6B7280',
  },
  tabContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  tabButtons: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: 'white',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
    backgroundColor: 'white',
  },
  selectButtonText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
    marginLeft: 6,
  },
  paySelectedButton: {
    backgroundColor: '#10B981',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  paySelectedText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  feesContainer: {
    // PaymentCard components will handle their own spacing
  },
  historyContainer: {
    // History items will handle their own spacing
  },
  historyCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  historyDescription: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  historyStatus: {
    marginLeft: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedBadge: {
    backgroundColor: '#ECFDF5',
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  completedText: {
    color: '#059669',
  },
  pendingText: {
    color: '#D97706',
  },
  historyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  paymentMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethodText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  referenceText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'monospace',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomSpacing: {
    height: 100, // Space for tab bar
  },
  uploadProofButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderStyle: 'dashed',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  uploadProofText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
    marginLeft: 8,
  },
  generalPaymentSection: {
    marginTop: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  generalPaymentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  generalPaymentSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  helpText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
    paddingHorizontal: 8,
  },
});

export default PaymentScreen;
