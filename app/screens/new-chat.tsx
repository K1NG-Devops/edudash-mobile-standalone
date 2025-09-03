import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import ComposeMessageModal from '@/components/messaging/ComposeMessageModal';
import { useAuth } from '@/contexts/SimpleWorkingAuth';

export default function NewChatScreen() {
  const router = useRouter();
  const { colorScheme } = useTheme();
  const palette = Colors[colorScheme];
  const { profile } = useAuth();
  const [showCompose, setShowCompose] = useState(false);

  const Item = ({
    icon,
    title,
    subtitle,
    color,
    onPress,
  }: {
    icon: string;
    title: string;
    subtitle: string;
    color: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity style={[styles.item, { borderBottomColor: palette.outline }]} onPress={onPress}>
      <View style={[styles.itemIcon, { backgroundColor: color }]}>
        <IconSymbol name={icon as any} size={18} color="#FFFFFF" />
      </View>
      <View style={styles.flex1}>
        <Text style={[styles.itemTitle, { color: palette.text }]}>{title}</Text>
        <Text style={[styles.itemSubtitle, { color: palette.textSecondary }]}>{subtitle}</Text>
      </View>
      <IconSymbol name="chevron.right" size={16} color={palette.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top','left','right'] }>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: palette.outline, backgroundColor: palette.surface }] }>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={18} color={palette.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: palette.text }]}>New chat</Text>
        <View style={styles.headerBtn} />
      </View>

      {/* Actions */}
      <View style={styles.ph16Pt16}>
        <Item
          icon="person.2"
          title="New group"
          subtitle="Create a new group conversation"
          color="#0EA5E9"
          onPress={() => router.push('/screens/new-group')}
        />
        <Item
          icon="person.3"
          title="New community"
          subtitle="Create a community"
          color="#8B5CF6"
          onPress={() => router.push('/screens/new-community')}
        />
        <Item
          icon="megaphone"
          title="New broadcast"
          subtitle="Start a broadcast list"
          color="#F59E0B"
          onPress={() => router.push('/screens/new-broadcast')}
        />
        <Item
          icon="square.and.pencil"
          title="New contact"
          subtitle="Start a chat with a contact"
          color="#25D366"
          onPress={() => setShowCompose(true)}
        />
      </View>

      {/* Compose full-screen modal */}
      <ComposeMessageModal
        visible={showCompose}
        onClose={() => setShowCompose(false)}
        profile={profile}
        childrenList={[]}
        mode="modal"
        onMessageSent={() => {
          setShowCompose(false);
          Alert.alert('Success', 'Message sent successfully!');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex1: { flex: 1 },
  ph16Pt16: { paddingHorizontal: 16, paddingTop: 16 },
  header: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  headerBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
});

