import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthConsumer } from '@/contexts/SimpleWorkingAuth';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { StatusBar } from 'react-native';

class OverviewScreen extends React.Component {
  render() {
    return (
      <AuthConsumer>
        {(auth) => (
          <SafeAreaView className="flex-1 bg-background">
            <StatusBar barStyle="light-content" translucent />
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              {/* Header */}
              <LinearGradient
                colors={['#059669', '#047857']}
                className="px-5 pt-5 pb-8 rounded-b-3xl"
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View className="items-center">
                  <Text className="text-3xl font-bold text-white mb-2">School Overview</Text>
                  <Text className="text-base text-gray-200 text-center opacity-90">
                    Complete insights into your school&apos;s performance
                  </Text>
                </View>
              </LinearGradient>

              {/* Quick Stats */}
              <View className="flex-row px-5 -mt-5 mb-8 justify-between">
                <View className="bg-white rounded-2xl p-5 items-center flex-1 mx-1 shadow-sm">
                  <View className="w-12 h-12 rounded-full bg-primary justify-center items-center mb-3">
                    <IconSymbol name="person.2.fill" size={24} color="#FFFFFF" />
                  </View>
                  <Text className="text-2xl font-bold text-foreground mb-1">24</Text>
                  <Text className="text-sm text-foreground-muted text-center">Teachers</Text>
                </View>
                
                <View className="bg-white rounded-2xl p-5 items-center flex-1 mx-1 shadow-sm">
                  <View className="w-12 h-12 rounded-full bg-success justify-center items-center mb-3">
                    <IconSymbol name="graduationcap.fill" size={24} color="#FFFFFF" />
                  </View>
                  <Text className="text-2xl font-bold text-foreground mb-1">186</Text>
                  <Text className="text-sm text-foreground-muted text-center">Students</Text>
                </View>
                
                <View className="bg-white rounded-2xl p-5 items-center flex-1 mx-1 shadow-sm">
                  <View className="w-12 h-12 rounded-full bg-warning justify-center items-center mb-3">
                    <IconSymbol name="book.fill" size={24} color="#FFFFFF" />
                  </View>
                  <Text className="text-2xl font-bold text-foreground mb-1">12</Text>
                  <Text className="text-sm text-foreground-muted text-center">Classes</Text>
                </View>
              </View>

              {/* Recent Activity */}
              <View className="mx-5 mb-6">
                <Text className="text-xl font-bold text-foreground mb-4">Recent Activity</Text>
                <View className="bg-white rounded-2xl p-5 shadow-sm">
                  <View className="flex-row items-center py-3">
                    <View className="w-9 h-9 rounded-full bg-secondary justify-center items-center mr-4">
                      <IconSymbol name="plus.circle.fill" size={20} color="#FFFFFF" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-foreground mb-0.5">New student enrolled</Text>
                      <Text className="text-sm text-foreground-muted">2 hours ago</Text>
                    </View>
                  </View>
                  
                  <View className="flex-row items-center py-3">
                    <View className="w-9 h-9 rounded-full bg-destructive justify-center items-center mr-4">
                      <IconSymbol name="message.fill" size={20} color="#FFFFFF" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-foreground mb-0.5">Parent message received</Text>
                      <Text className="text-sm text-foreground-muted">4 hours ago</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View className="h-24" />
            </ScrollView>
          </SafeAreaView>
        )}
      </AuthConsumer>
    );
  }
}

export default OverviewScreen;
