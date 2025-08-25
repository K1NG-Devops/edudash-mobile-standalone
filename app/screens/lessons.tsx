import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/SimpleWorkingAuth';
import { supabase } from '@/lib/supabase';

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  category_id: string;
  age_group_id: string;
  duration_minutes: number | null;
  difficulty_level: number | null;
  is_public: boolean;
  created_at: string;
}

export default function LessonsScreen() {
  const { colorScheme } = useTheme();
  const { user, profile } = useAuth();
  const palette = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLessons();
  }, []);

  const loadLessons = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!profile?.preschool_id) {
        setError('No preschool assigned to this account');
        return;
      }

      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('preschool_id', profile.preschool_id)
        .order('created_at', { ascending: false });

      if (lessonsError) throw lessonsError;
      setLessons(lessonsData || []);

    } catch (error: any) {
      console.error('Error loading lessons:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredLessons = lessons.filter(lesson =>
    lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (lesson.description && lesson.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderLessonCard = (lesson: Lesson) => {
    const isPublic = lesson.is_public;
    const statusColor = isPublic ? '#10B981' : '#F59E0B';
    const statusBg = isPublic ? (isDark ? '#064E3B' : '#D1FAE5') : (isDark ? '#92400E' : '#FEF3C7');

    return (
      <TouchableOpacity
        key={lesson.id}
        style={[styles.lessonCard, { backgroundColor: palette.surface, borderColor: palette.outline }]}
        onPress={() => {
          // Navigate to lesson details or edit
        }}
      >
        <View style={styles.lessonHeader}>
          <Text style={[styles.lessonTitle, { color: palette.text }]} numberOfLines={2}>
            {lesson.title}
          </Text>
          <View style={[styles.lessonStatus, { backgroundColor: statusBg }]}>
            <Text style={[styles.lessonStatusText, { color: statusColor }]}>
              {isPublic ? 'Public' : 'Private'}
            </Text>
          </View>
        </View>
        
        {lesson.description && (
          <Text style={[styles.lessonDescription, { color: palette.textSecondary }]} numberOfLines={3}>
            {lesson.description}
          </Text>
        )}
        
        <View style={styles.lessonMeta}>
          <View style={styles.metaItem}>
            <IconSymbol name="clock" size={14} color={palette.textSecondary} />
            <Text style={[styles.metaText, { color: palette.textSecondary }]}>
              {lesson.duration_minutes || 'N/A'} min
            </Text>
          </View>
          <View style={styles.metaItem}>
            <IconSymbol name="star" size={14} color={palette.textSecondary} />
            <Text style={[styles.metaText, { color: palette.textSecondary }]}>
              Level {lesson.difficulty_level || 'N/A'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={palette.primary} />
          <Text style={[styles.loadingText, { color: palette.textSecondary }]}>
            Loading lessons...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: palette.error }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: palette.primary }]}
            onPress={loadLessons}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: palette.surface, borderBottomColor: palette.outline }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={24} color={palette.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: palette.text }]}>All Lessons</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            // Navigate to add new lesson
          }}
        >
          <IconSymbol name="plus" size={24} color={palette.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: palette.surface, borderColor: palette.outline }]}>
          <IconSymbol name="magnifyingglass" size={20} color={palette.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: palette.text }]}
            placeholder="Search lessons..."
            placeholderTextColor={palette.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <IconSymbol name="xmark.circle.fill" size={20} color={palette.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {filteredLessons.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIcon, { backgroundColor: palette.surface }]}>
              <IconSymbol name="book" size={32} color={palette.textSecondary} />
            </View>
            <Text style={[styles.emptyTitle, { color: palette.text }]}>
              {searchQuery ? 'No lessons found' : 'No lessons yet'}
            </Text>
            <Text style={[styles.emptyDescription, { color: palette.textSecondary }]}>
              {searchQuery 
                ? 'Try adjusting your search terms'
                : 'Create your first lesson to get started'
              }
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: palette.primary }]}
                onPress={() => {
                  // Navigate to create lesson
                }}
              >
                <Text style={styles.createButtonText}>Create Lesson</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.lessonsGrid}>
            {filteredLessons.map(renderLessonCard)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  addButton: {
    padding: 4,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  createButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  lessonsGrid: {
    gap: 16,
  },
  lessonCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  lessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  lessonTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
    lineHeight: 24,
  },
  lessonStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  lessonStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  lessonDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  lessonMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
