import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useBillingHistory } from '@/lib/hooks/useBillingHistory'
import { useTheme } from '@/contexts/ThemeContext'

interface Props {
  userId: string
}

export const BillingHistoryCard = ({ userId }: Props) => {
  const { colorScheme } = useTheme()
  const isDark = colorScheme === 'dark'
  const { data = [], isLoading } = useBillingHistory(userId)

  return (
    <View style={[styles.card, { backgroundColor: isDark ? '#0F172A' : '#FFFFFF' }]}>
      <Text style={[styles.title, { color: isDark ? '#E5E7EB' : '#1F2937' }]}>Billing History</Text>
      {isLoading ? (
        <Text style={{ color: isDark ? '#94A3B8' : '#6B7280' }}>Loading…</Text>
      ) : data.length === 0 ? (
        <Text style={{ color: isDark ? '#94A3B8' : '#6B7280' }}>No payments yet.</Text>
      ) : (
        data.slice(0, 5).map((p) => (
          <View key={p.id} style={styles.row}>
            <Text style={[styles.amount, { color: isDark ? '#F8FAFC' : '#111827' }]}>R{p.amount.toFixed(2)}</Text>
            <Text style={[styles.status, { color: p.status === 'completed' ? '#10B981' : p.status === 'pending' ? '#F59E0B' : '#EF4444' }]}>
              {p.status}
            </Text>
            <Text style={[styles.date, { color: isDark ? '#94A3B8' : '#6B7280' }]}>
              {new Date(p.processed_at).toISOString().slice(0, 10)}
            </Text>
          </View>
        ))
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  amount: {
    fontSize: 14,
    fontWeight: '600',
  },
  status: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  date: {
    fontSize: 12,
  },
})

