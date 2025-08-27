import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/SimpleWorkingAuth';
import { TeacherDataService } from '@/lib/services/teacherDataService';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { supabase } from '@/lib/supabase';

interface ActivityItem {
  id: string;
  type: 'homework_graded' | 'message_sent' | 'report_created' | 'activity_completed';
  title: string;
  description: string;
  timestamp: string;
  student_name?: string;
  class_name?: string;
}

export default function ActivitiesScreen() {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const { profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'teacher' | 'events' | 'announcements'>('teacher');
  const [eventsHasMore, setEventsHasMore] = useState(true);
  const EVENTS_PAGE_SIZE = 10;

  const bg = isDark ? '#0B1220' : '#F8FAFC';
  const card = isDark ? '#0F172A' : '#FFFFFF';
  const text = isDark ? '#F1F5F9' : '#1F2937';
  const sub = isDark ? '#94A3B8' : '#6B7280';
  const border = isDark ? '#334155' : '#E5E7EB';

  const timeAgo = (iso: string) => {
    const now = Date.now();
    const then = new Date(iso).getTime();
    const diff = Math.max(0, now - then);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const fetchEvents = async (offset = 0) => {
    if (!profile?.preschool_id) return [] as any[];
    const { data: ev } = await (supabase as any)
      .from('events')
      .select('id,title,description,start_date,end_date,location')
      .eq('preschool_id', profile.preschool_id)
      .order('start_date', { ascending: true })
      .range(offset, offset + EVENTS_PAGE_SIZE - 1);
    return ev || [];
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (profile?.role === 'teacher') {
        setActiveTab('teacher');
        const data = await TeacherDataService.getTeacherDashboardData(profile.auth_user_id);
        setActivities((data?.recent_activities || []) as ActivityItem[]);
      } else {
        // Parent/Admin: fetch events and announcements
        setActiveTab('events');
        if (profile?.preschool_id) {
          const first = await fetchEvents(0);
          setEvents(first);
          setEventsHasMore((first || []).length === EVENTS_PAGE_SIZE);
        }
        if (profile?.auth_user_id) {
          const { data: u } = await (supabase as any)
            .from('users')
            .select('id')
            .eq('auth_user_id', profile.auth_user_id)
            .single();
          if (u?.id) {
            const { data: msgs } = await (supabase as any)
              .from('message_recipients')
              .select(`read_at, message:messages(id, content, created_at, sender_id, message_type)`) 
              .eq('recipient_id', u.id)
              .eq('message.message_type', 'announcement')
              .order('created_at', { ascending: false })
              .limit(20);
            setAnnouncements((msgs || []).map((r: any) => r.message));
          }
        }
      }
    } catch {
      setActivities([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile?.auth_user_id, profile?.role]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
  };

  const iconFor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'homework_graded': return 'doc.text.below.ecg';
      case 'message_sent': return 'bubble.left.and.bubble.right';
      case 'report_created': return 'chart.bar.doc.horizontal';
      default: return 'figure.run';
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: bg }]}> 
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={{ marginTop: 12, color: sub }}>Loading activities…</Text>
      </View>
    );
  }

  if (profile?.role !== 'teacher') {
    // Parent/Admin view with toggle between Events and Announcements
    return (
      <View style={{ flex: 1, backgroundColor: bg }}>
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: border }}>
          <TouchableOpacity onPress={() => setActiveTab('events')} style={[styles.tabBtn, activeTab === 'events' && [styles.tabBtnActive, { borderColor: '#8B5CF6' }]]}>
            <Text style={{ color: activeTab === 'events' ? '#8B5CF6' : sub, fontWeight: '600' }}>Events</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('announcements')} style={[styles.tabBtn, activeTab === 'announcements' && [styles.tabBtnActive, { borderColor: '#8B5CF6' }]]}>
            <Text style={{ color: activeTab === 'announcements' ? '#8B5CF6' : sub, fontWeight: '600' }}>Announcements</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'events' ? (
          events.length ? (
            <ScrollView style={{ flex: 1, backgroundColor: bg }} contentContainerStyle={{ padding: 16 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
              {events.map((e: any) => (
                <View key={e.id} style={[styles.card, { backgroundColor: card, borderColor: border }]}> 
                  <View style={styles.row}>
                    <View style={[styles.iconWrap, { backgroundColor: isDark ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.1)' }]}> 
                      <IconSymbol name="calendar" size={20} color="#10B981" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.title, { color: text }]} numberOfLines={1}>{e.title}</Text>
                      {!!e.description && <Text style={[styles.desc, { color: sub }]} numberOfLines={2}>{e.description}</Text>}
                      <View style={styles.metaRow}>
                        <Text style={[styles.meta, { color: sub }]}>{new Date(e.start_date).toLocaleDateString()}</Text>
                        {!!e.location && <Text style={[styles.meta, { color: sub }]}>{e.location}</Text>}
                      </View>
                    </View>
                  </View>
                </View>
              ))}
              {eventsHasMore && (
                <TouchableOpacity
                  onPress={async () => {
                    const next = await fetchEvents(events.length);
                    setEvents(prev => [...prev, ...next]);
                    setEventsHasMore(next.length === EVENTS_PAGE_SIZE);
                  }}
                  style={{ alignSelf: 'center', marginTop: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: isDark ? '#1E293B' : '#E5E7EB' }}
                >
                  <Text style={{ color: isDark ? '#E5E7EB' : '#111827' }}>Load more</Text>
                </TouchableOpacity>
              )}
              <View style={{ height: 24 }} />
            </ScrollView>
          ) : (
            <View style={[styles.center, { backgroundColor: bg, padding: 24 }]}> 
              <Text style={{ color: sub }}>No upcoming events.</Text>
            </View>
          )
        ) : (
          announcements.length ? (
            <ScrollView style={{ flex: 1, backgroundColor: bg }} contentContainerStyle={{ padding: 16 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
              {announcements.map((a: any) => (
                <View key={a.id} style={[styles.card, { backgroundColor: card, borderColor: border }]}> 
                  <View style={styles.row}>
                    <View style={[styles.iconWrap, { backgroundColor: isDark ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.1)' }]}> 
                      <IconSymbol name="megaphone.fill" size={20} color="#8B5CF6" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.title, { color: text }]} numberOfLines={2}>{a.content}</Text>
                      <View style={styles.metaRow}>
                        <Text style={[styles.meta, { color: sub }]}>{timeAgo(a.created_at)}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
              <View style={{ height: 24 }} />
            </ScrollView>
          ) : (
            <View style={[styles.center, { backgroundColor: bg, padding: 24 }]}> 
              <Text style={{ color: sub }}>No announcements yet.</Text>
            </View>
          )
        )}
      </View>
    );
  }

  if (!activities.length) {
    return (
      <View style={[styles.center, { backgroundColor: bg, padding: 24 }]}> 
        <View style={[styles.emptyIcon, { backgroundColor: isDark ? 'rgba(139,92,246,0.15)' : 'rgba(139,92,246,0.08)' }]}> 
          <IconSymbol name="figure.run" size={64} color="#8B5CF6" />
        </View>
        <Text style={[styles.emptyTitle, { color: text }]}>No activities yet</Text>
        <Text style={[styles.emptyText, { color: sub }]}>Recent classroom activities will appear here.</Text>
        {profile?.role !== 'teacher' && (
          <Text style={[styles.emptyHint, { color: sub }]}>Activities for your role are coming soon.</Text>
        )}
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: bg }}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {activities.map((a) => (
        <View key={a.id} style={[styles.card, { backgroundColor: card, borderColor: border }]}> 
          <View style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: isDark ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.1)' }]}> 
              <IconSymbol name={iconFor(a.type) as any} size={20} color="#8B5CF6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: text }]} numberOfLines={1}>{a.title}</Text>
              <Text style={[styles.desc, { color: sub }]} numberOfLines={2}>{a.description}</Text>
              <View style={styles.metaRow}>
                {!!a.class_name && (
                  <Text style={[styles.meta, { color: sub }]}>Class: {a.class_name}</Text>
                )}
                <Text style={[styles.meta, { color: sub }]}>{timeAgo(a.timestamp)}</Text>
              </View>
            </View>
          </View>
        </View>
      ))}
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: 'transparent' },
  tabBtnActive: { backgroundColor: 'rgba(139,92,246,0.08)' },
  emptyIcon: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  emptyText: { fontSize: 14, textAlign: 'center', marginBottom: 4 },
  emptyHint: { fontSize: 12, textAlign: 'center', marginTop: 2 },

  card: { borderRadius: 12, padding: 12, borderWidth: 1, marginBottom: 12 },
  row: { flexDirection: 'row', gap: 12 },
  iconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '600' },
  desc: { fontSize: 14, marginTop: 2 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  meta: { fontSize: 12 },
});
