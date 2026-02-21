import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tutorService } from '../../services/endpoints';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, SHADOWS } from '../../config';

const DashboardScreen = ({ navigation }) => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await tutorService.getClasses();
      setClasses(response.data?.classes || response.data || []);
    } catch (error) {
      setClasses(getMockClasses());
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchClasses();
    setRefreshing(false);
  }, []);

  const handleDelete = (classId, title) => {
    Alert.alert(
      'Delete Class',
      `Are you sure you want to delete "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await tutorService.deleteClass(classId);
              setClasses((prev) => prev.filter((c) => c.id !== classId));
            } catch (error) {
              setClasses((prev) => prev.filter((c) => c.id !== classId));
            }
          },
        },
      ]
    );
  };

  const renderClassCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        {item.promotion && (
          <View style={styles.promotedBadge}>
            <Ionicons name="flash" size={12} color={COLORS.white} />
            <Text style={styles.promotedText}>Promoted</Text>
          </View>
        )}
      </View>

      <View style={styles.cardInfo}>
        <InfoChip icon="book-outline" text={item.subject} />
        <InfoChip icon="school-outline" text={`Grade ${item.grade}`} />
        <InfoChip icon="location-outline" text={item.location} />
      </View>

      <View style={styles.cardStats}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{item.enrollment_count || 0}</Text>
          <Text style={styles.statLabel}>Students</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{item.rating?.toFixed(1) || '0.0'}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{item.price ? `Rs.${item.price}` : 'Free'}</Text>
          <Text style={styles.statLabel}>Price</Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('AddEditClass', { classData: item, mode: 'edit' })}
        >
          <Ionicons name="create-outline" size={18} color={COLORS.primary} />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Announcements', { classId: item.id, classTitle: item.title })}
        >
          <Ionicons name="megaphone-outline" size={18} color={COLORS.secondary} />
          <Text style={[styles.actionText, { color: COLORS.secondary }]}>Announce</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('EnrollmentsList', { classId: item.id, classTitle: item.title })}
        >
          <Ionicons name="people-outline" size={18} color={COLORS.success} />
          <Text style={[styles.actionText, { color: COLORS.success }]}>Students</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Promotion', { classId: item.id, classTitle: item.title })}
        >
          <Ionicons name="rocket-outline" size={18} color="#8B5CF6" />
          <Text style={[styles.actionText, { color: '#8B5CF6' }]}>Promote</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDelete(item.id, item.title)}
      >
        <Ionicons name="trash-outline" size={16} color={COLORS.error} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Welcome Header */}
      <View style={styles.welcomeBar}>
        <Text style={styles.welcomeText}>Welcome, {user?.name || 'Tutor'}</Text>
        <Text style={styles.classCount}>{classes.length} class{classes.length !== 1 ? 'es' : ''}</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={classes}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={renderClassCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="school-outline" size={64} color={COLORS.grayLight} />
              <Text style={styles.emptyText}>No classes yet</Text>
              <Text style={styles.emptySubText}>Add your first class to get started</Text>
            </View>
          }
        />
      )}

      {/* FAB for adding class */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddEditClass', { mode: 'add' })}
      >
        <Ionicons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
};

const InfoChip = ({ icon, text }) => (
  <View style={styles.chip}>
    <Ionicons name={icon} size={13} color={COLORS.primary} />
    <Text style={styles.chipText}>{text}</Text>
  </View>
);

const getMockClasses = () => [
  {
    id: 1, title: 'Advanced Mathematics - O/L', subject: 'Mathematics', grade: '11',
    location: 'Colombo', schedule: 'Mon & Wed 4:00 PM', price: 3000,
    rating: 4.5, enrollment_count: 25, promotion: true,
  },
  {
    id: 2, title: 'Physics for A/L Students', subject: 'Physics', grade: '12',
    location: 'Kandy', schedule: 'Tue & Thu 5:00 PM', price: 3500,
    rating: 4.8, enrollment_count: 18, promotion: false,
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  welcomeBar: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
  },
  classCount: {
    fontSize: 14,
    color: COLORS.gray,
  },
  listContent: {
    padding: 16,
    paddingBottom: 90,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    ...SHADOWS.small,
    position: 'relative',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingRight: 30,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.black,
    flex: 1,
  },
  promotedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 3,
    marginLeft: 8,
  },
  promotedText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },
  cardInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  chipText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  cardStats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.grayLight,
    paddingTop: 12,
    marginBottom: 12,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: COLORS.grayLight,
    paddingTop: 12,
  },
  actionButton: {
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  deleteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray,
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 6,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.large,
  },
});

export default DashboardScreen;
