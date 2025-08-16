import { IconSymbol } from '@/components/ui/IconSymbol';
import { PaymentMethod } from '@/types/payment-types';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface PaymentMethodOption {
  method: PaymentMethod;
  title: string;
  description: string;
  icon: string;
  enabled: boolean;
}

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod | null;
  onSelectMethod: (method: PaymentMethod) => void;
  disabled?: boolean;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onSelectMethod,
  disabled = false,
}) => {
  const paymentMethods: PaymentMethodOption[] = [
    {
      method: 'card',
      title: 'Credit/Debit Card',
      description: 'Pay instantly with your card',
      icon: 'creditcard.fill',
      enabled: true,
    },
    {
      method: 'bank_transfer',
      title: 'Bank Transfer',
      description: 'Transfer directly from your bank',
      icon: 'building.columns.fill',
      enabled: true,
    },
    {
      method: 'eft',
      title: 'EFT Payment',
      description: 'Electronic funds transfer',
      icon: 'arrow.left.arrow.right',
      enabled: true,
    },
    {
      method: 'payfast',
      title: 'PayFast',
      description: 'Secure South African payment gateway',
      icon: 'shield.checkered',
      enabled: true,
    },
  ];

  const getMethodColor = (method: PaymentMethod) => {
    const colors = {
      card: '#3B82F6',
      bank_transfer: '#10B981',
      eft: '#8B5CF6',
      payfast: '#F59E0B',
      stripe: '#6366F1',
      cash: '#6B7280',
    };
    return colors[method] || '#6B7280';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Payment Method</Text>
      <Text style={styles.subtitle}>Choose how you would like to pay</Text>

      <ScrollView
        style={styles.methodsList}
        showsVerticalScrollIndicator={false}
      >
        {paymentMethods.map((method) => (
          <TouchableOpacity
            key={method.method}
            style={[
              styles.methodCard,
              selectedMethod === method.method && styles.selectedMethodCard,
              (!method.enabled || disabled) && styles.disabledMethodCard,
            ]}
            onPress={() => method.enabled && !disabled && onSelectMethod(method.method)}
            disabled={!method.enabled || disabled}
            activeOpacity={0.7}
          >
            <View style={styles.methodContent}>
              <View style={[
                styles.methodIcon,
                { backgroundColor: `${getMethodColor(method.method)}20` }
              ]}>
                <IconSymbol
                  name={method.icon}
                  size={24}
                  color={getMethodColor(method.method)}
                />
              </View>

              <View style={styles.methodInfo}>
                <Text style={[
                  styles.methodTitle,
                  (!method.enabled || disabled) && styles.disabledText
                ]}>
                  {method.title}
                </Text>
                <Text style={[
                  styles.methodDescription,
                  (!method.enabled || disabled) && styles.disabledText
                ]}>
                  {method.description}
                </Text>
              </View>

              <View style={styles.methodSelector}>
                {selectedMethod === method.method ? (
                  <View style={[
                    styles.selectedIndicator,
                    { backgroundColor: getMethodColor(method.method) }
                  ]}>
                    <IconSymbol name="checkmark" size={16} color="white" />
                  </View>
                ) : (
                  <View style={[
                    styles.unselectedIndicator,
                    { borderColor: getMethodColor(method.method) }
                  ]} />
                )}
              </View>
            </View>

            {!method.enabled && (
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>Coming Soon</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selectedMethod && (
        <View style={styles.selectedMethodInfo}>
          <IconSymbol name="info.circle.fill" size={16} color="#3B82F6" />
          <Text style={styles.selectedMethodText}>
            You've selected {paymentMethods.find(m => m.method === selectedMethod)?.title}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  methodsList: {
    flex: 1,
  },
  methodCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedMethodCard: {
    borderColor: '#3B82F6',
    backgroundColor: '#F8FAFF',
  },
  disabledMethodCard: {
    opacity: 0.5,
  },
  methodContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  methodInfo: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  disabledText: {
    color: '#9CA3AF',
  },
  methodSelector: {
    marginLeft: 12,
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unselectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
  },
  comingSoonBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  comingSoonText: {
    fontSize: 10,
    color: '#92400E',
    fontWeight: '600',
  },
  selectedMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF4FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  selectedMethodText: {
    fontSize: 14,
    color: '#1E40AF',
    marginLeft: 8,
    fontWeight: '500',
  },
});

export default PaymentMethodSelector;
