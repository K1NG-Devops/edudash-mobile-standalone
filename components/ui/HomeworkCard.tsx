import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

import { HomeworkAssignment } from '@/types/homework-types';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface HomeworkCardProps {
  assignment: HomeworkAssignment;
  onPress: () => void;
}

const HomeworkCard: React.FC<HomeworkCardProps> = ({ assignment, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.imageContainer}>
        {assignment.lesson?.thumbnail_url && (
          <Image source={{ uri: assignment.lesson.thumbnail_url }} style={styles.thumbnail} />
        )}
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{assignment.title}</Text>
        <Text style={styles.lessonTitle}>
          <IconSymbol name="book.fill" size={14} color="#6B7280" /> {assignment.lesson?.title}
        </Text>
        <View style={styles.detailsRow}>
          <IconSymbol name="calendar" size={14} color="#6B7280" />
          <Text style={styles.detailsText}>Due in {assignment.due_date_offset_days} days</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    marginVertical: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: {
    marginRight: 16,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  lessonTitle: {
    fontSize: 14,
    color: '#4B5563',
    marginVertical: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
});

export default HomeworkCard;

