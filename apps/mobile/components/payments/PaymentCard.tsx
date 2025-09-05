import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { PaymentFee } from '@/types/payment-types';

const { width: screenWidth } = Dimensions.get('window');

interface PaymentCardProps {
  fee: PaymentFee;
  onPayPress: (fee: PaymentFee) => void;
  onSelectToggle?: (fee: PaymentFee, selected: boolean) => void;
  isSelected?: boolean;
  showStudentName?: boolean;
  showCheckbox?: boolean;
}

const PaymentCard: React.FC<PaymentCardProps> = ({
  fee,
  onPayPress,
  onSelectToggle,
  isSelected = false,
  showStudentName = true,
  showCheckbox = false,
}) => {
  const isOverdue = new Date(fee.due_date) < new Date();
  const daysUntilDue = Math.ceil(
    (new Date(fee.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  const getFeeTypeIcon = (feeType: string) => {
    const icons = {
      tuition: 'graduationcap.fill',
      activity: 'paintbrush.fill',
      meal: 'fork.knife',
      transport: 'car.fill',
      material: 'book.fill',
      late_fee: 'exclamationmark.triangle.fill',
      registration: 'person.badge.plus.fill',
      other: 'doc.text.fill',
    };
    return icons[feeType as keyof typeof icons] || 'dollarsign.circle.fill';
  };

  const getFeeTypeColor = (feeType: string) => {
    // All cards are white with subtle shadows - like banking apps
    return ['#FFFFFF', '#FFFFFF'];
  };

  const getFeeTypeAccentColor = (feeType: string) => {
    // Subtle accent colors for icons and borders only
    const colors = {
      tuition: '#374151',     // Dark gray
      activity: '#F59E0B',    // Amber
      meal: '#10B981',        // Emerald  
      transport: '#3B82F6',   // Blue
      material: '#8B5CF6',    // Purple
      late_fee: '#EF4444',    // Red
      registration: '#06B6D4', // Cyan
      other: '#6B7280',       // Gray
    };
    return colors[feeType as keyof typeof colors] || '#6B7280';
  };

  const formatCurrency = (amount: number, currency: string = 'ZAR') => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getDueDateLabel = () => {
    if (isOverdue) {
      const daysOverdue = Math.abs(daysUntilDue);
      return `${daysOverdue} day${daysOverdue === 1 ? '' : 's'} overdue`;
    } else if (daysUntilDue === 0) {
      return 'Due today';
    } else if (daysUntilDue === 1) {
      return 'Due tomorrow';
    } else if (daysUntilDue <= 7) {
      return `Due in ${daysUntilDue} days`;
    }
    return `Due ${formatDate(fee.due_date)}`;
  };

  const accentColor = getFeeTypeAccentColor(fee.fee_type);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSelected && styles.selectedContainer,
        isOverdue && styles.overdueContainer,
      ]}
      onPress={showCheckbox ? () => onSelectToggle?.(fee, !isSelected) : () => onPayPress(fee)}
      activeOpacity={0.95}
    >
      <View style={[
        styles.card,
        isOverdue && styles.overdueCard,
        isSelected && styles.selectedCard
      ]}>
        {/* Header with icon and checkbox */}
        <View style={styles.header}>
          <View style={styles.leftHeader}>
            <View style={[styles.iconContainer, { backgroundColor: `${accentColor}15` }]}>
              <IconSymbol 
                name={getFeeTypeIcon(fee.fee_type)} 
                size={24} 
                color={accentColor} 
              />
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{fee.title}</Text>
              {showStudentName && fee.student && (
                <Text style={styles.studentName}>
                  {fee.student.first_name} {fee.student.last_name}
                </Text>
              )}
            </View>
          </View>
          
          {showCheckbox && (
            <TouchableOpacity
              style={[styles.checkbox, isSelected && styles.checkboxSelected]}
              onPress={() => onSelectToggle?.(fee, !isSelected)}
            >
              {isSelected && (
                <IconSymbol name="checkmark" size={16} color="#3B82F6" />
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Description */}
        {fee.description && (
          <Text style={styles.description} numberOfLines={2}>
            {fee.description}
          </Text>
        )}

        {/* Amount and due date row */}
        <View style={styles.detailsRow}>
          <View style={styles.amountSection}>
            <Text style={styles.amount}>
              {formatCurrency(fee.amount, fee.currency)}
            </Text>
            {fee.is_recurring && (
              <View style={styles.recurringBadge}>
                <Text style={styles.recurringText}>
                  {fee.recurring_frequency === 'monthly' ? 'Monthly' : 
                   fee.recurring_frequency === 'quarterly' ? 'Quarterly' : 'Annual'}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.dueDateSection}>
            <View style={[
              styles.dueDateBadge,
              isOverdue ? styles.overdueBadge : styles.upcomingBadge
            ]}>
              <IconSymbol 
                name={isOverdue ? "exclamationmark.triangle.fill" : "calendar"} 
                size={12} 
                color={isOverdue ? "#EF4444" : "#10B981"} 
              />
              <Text style={[
                styles.dueDateText,
                isOverdue ? styles.overdueText : styles.upcomingText
              ]}>
                {getDueDateLabel()}
              </Text>
            </View>
          </View>
        </View>

        {/* Pay button */}
        {!showCheckbox && (
          <TouchableOpacity
            style={[
              styles.payButton,
              isOverdue ? styles.payButtonUrgent : styles.payButtonNormal
            ]}
            onPress={() => onPayPress(fee)}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.payButtonText,
              isOverdue ? styles.payButtonTextUrgent : styles.payButtonTextNormal
            ]}>
              {isOverdue ? 'Pay Now' : 'Pay'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  selectedContainer: {
    transform: [{ scale: 0.98 }],
  },
  overdueContainer: {
    // Overdue styling handled in card itself
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  overdueCard: {
    borderColor: '#FEE2E2',
    borderWidth: 1.5,
  },
  selectedCard: {
    borderColor: '#3B82F6',
    borderWidth: 2,
    shadowColor: '#3B82F6',
    shadowOpacity: 0.15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  leftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  studentName: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxSelected: {
    backgroundColor: '#EBF4FF',
    borderColor: '#3B82F6',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  amountSection: {
    flex: 1,
  },
  amount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  recurringBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  recurringText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  dueDateSection: {
    alignItems: 'flex-end',
  },
  dueDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  overdueBadge: {
    backgroundColor: '#FEE2E2',
  },
  upcomingBadge: {
    backgroundColor: '#ECFDF5',
  },
  dueDateText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  overdueText: {
    color: '#EF4444',
  },
  upcomingText: {
    color: '#10B981',
  },
  payButton: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  payButtonNormal: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  payButtonUrgent: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  payButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  payButtonTextNormal: {
    color: '#374151',
  },
  payButtonTextUrgent: {
    color: '#DC2626',
  },
});

export default PaymentCard;
