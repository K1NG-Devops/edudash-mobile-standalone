import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { Student } from '@/types/types';
import { AuthConsumer } from '@/contexts/SimpleWorkingAuth';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface ChildrenScreenState {
  children: Student[];
  loading: boolean;
  refreshing: boolean;
}

class ChildrenScreen extends React.Component<{}, ChildrenScreenState> {
  state: ChildrenScreenState = {
    children: [],
    loading: true,
    refreshing: false,
  };

  componentDidMount() {
    this.fetchChildren();
  }

  fetchChildren = async (userId?: string) => {
    if (!userId) return;
    
    try {
      this.setState({ loading: true });
      
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          age_group:age_groups(name),
          class:classes(name)
        `)
        .eq('parent_id', userId);
      
      if (error) {
        console.error('Error fetching children:', error);
      } else {
        this.setState({ children: data || [] });
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      this.setState({ loading: false });
    }
  };

  onRefresh = () => {
    this.setState({ refreshing: true });
    // Re-fetch data here if needed
    setTimeout(() => this.setState({ refreshing: false }), 2000);
  };

  calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  renderChild = ({ item }: { item: Student }) => {
    const age = this.calculateAge(item.date_of_birth);
    
    return (
      <TouchableOpacity style={styles.childCard}>
        <View style={styles.childHeader}>
          <View style={styles.childAvatar}>
            <Text style={styles.childAvatarText}>
              {item.first_name.charAt(0)}{item.last_name.charAt(0)}
            </Text>
          </View>
          <View style={styles.childInfo}>
            <Text style={styles.childName}>{item.first_name} {item.last_name}</Text>
            <Text style={styles.childAge}>Age: {age} years old</Text>
          </View>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: item.is_active ? '#10B981' : '#EF4444' }]} />
            <Text style={styles.statusText}>{item.is_active ? 'Active' : 'Inactive'}</Text>
          </View>
        </View>
        
        <View style={styles.childDetails}>
          <View style={styles.detailRow}>
            <IconSymbol name="calendar" size={16} color="#6B7280" />
            <Text style={styles.detailText}>DOB: {new Date(item.date_of_birth).toLocaleDateString()}</Text>
          </View>
          
          {item.class_name && (
            <View style={styles.detailRow}>
              <IconSymbol name="book.fill" size={16} color="#6B7280" />
              <Text style={styles.detailText}>Class: {item.class_name}</Text>
            </View>
          )}
          
          {item.age_group?.name && (
            <View style={styles.detailRow}>
              <IconSymbol name="person.2.fill" size={16} color="#6B7280" />
              <Text style={styles.detailText}>Age Group: {item.age_group.name}</Text>
            </View>
          )}
          
          <View style={styles.detailRow}>
            <IconSymbol name="calendar.badge.plus" size={16} color="#6B7280" />
            <Text style={styles.detailText}>Enrolled: {new Date(item.enrollment_date).toLocaleDateString()}</Text>
          </View>
        </View>
        
        {(item.allergies || item.special_needs) && (
          <View style={styles.alertsContainer}>
            {item.allergies && (
              <View style={styles.alertItem}>
                <IconSymbol name="exclamationmark.triangle.fill" size={16} color="#F59E0B" />
                <Text style={styles.alertText}>Allergies: {item.allergies}</Text>
              </View>
            )}
            {item.special_needs && (
              <View style={styles.alertItem}>
                <IconSymbol name="heart.fill" size={16} color="#8B5CF6" />
                <Text style={styles.alertText}>Special Needs: {item.special_needs}</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  renderContent = (auth: any) => {
    const { profile } = auth;
    const { children, loading, refreshing } = this.state;

    // Fetch children when profile is available
    if (profile?.id && children.length === 0 && !loading) {
      this.fetchChildren(profile.id);
    }

    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={['#3B82F6', '#1E40AF']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>My Children</Text>
              <Text style={styles.headerSubtitle}>
                {children.length} {children.length === 1 ? 'child' : 'children'} enrolled
              </Text>
            </View>
            <View style={styles.headerIcon}>
              <IconSymbol name="figure.2.and.child.holdinghands" size={32} color="white" />
            </View>
          </View>
        </LinearGradient>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading children...</Text>
          </View>
        ) : children.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol name="figure.2.and.child.holdinghands" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Children Found</Text>
            <Text style={styles.emptyText}>
              Contact your school administrator to add your children to your account.
            </Text>
          </View>
        ) : (
          <FlatList
            data={children}
            keyExtractor={(item) => item.id}
            renderItem={this.renderChild}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={this.onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    );
  };

  render() {
    return (
      <AuthConsumer>
        {(auth) => this.renderContent(auth)}
      </AuthConsumer>
    );
  }
}

export default ChildrenScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 24,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  listContainer: {
    padding: 24,
    paddingBottom: 100,
  },
  childCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  childHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  childAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  childAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  childAge: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  childDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 8,
  },
  alertsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  alertText: {
    fontSize: 14,
    color: '#92400E',
    marginLeft: 8,
    flex: 1,
  },
});
