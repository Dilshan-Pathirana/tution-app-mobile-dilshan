import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tutorService } from '../../services/endpoints';
import { COLORS, SHADOWS } from '../../config';

const EnrollmentsListScreen = ({ route }) => {
  const { classId, classTitle } = route.params;
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      const response = await tutorService.getEnrollments(classId);
      setStudents(response.data?.students || response.data || []);
    } catch (error) {
      setStudents(getMock());
    } finally {
      setLoading(false);
    }
  };

  const renderStudent = ({ item, index }) => (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{(item.name || 'S')[0].toUpperCase()}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name || 'Student'}</Text>
        <Text style={styles.email}>{item.email || ''}</Text>
        <Text style={styles.date}>Enrolled: {item.enrolled_at ? new Date(item.enrolled_at).toLocaleDateString() : 'N/A'}</Text>
      </View>
      <Text style={styles.index}>#{index + 1}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.classTitle}>{classTitle}</Text>
        <View style={styles.countBadge}>
          <Ionicons name="people" size={16} color={COLORS.white} />
          <Text style={styles.countText}>{students.length}</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={students}
          keyExtractor={(item) => item.id?.toString() || item.email}
          renderItem={renderStudent}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={64} color={COLORS.grayLight} />
              <Text style={styles.emptyText}>No students enrolled yet</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const getMock = () => [
  { id: 1, name: 'Kamal Perera', email: 'kamal@email.com', enrolled_at: '2026-02-15T10:00:00Z' },
  { id: 2, name: 'Nimali Fernando', email: 'nimali@email.com', enrolled_at: '2026-02-16T08:00:00Z' },
  { id: 3, name: 'Roshan Silva', email: 'roshan@email.com', enrolled_at: '2026-02-18T14:00:00Z' },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.white, padding: 16, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center', ...SHADOWS.small,
  },
  classTitle: { fontSize: 16, fontWeight: '600', color: COLORS.primary, flex: 1 },
  countBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6,
  },
  countText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  listContent: { padding: 16 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: 14, padding: 16, marginBottom: 10, ...SHADOWS.small,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primaryLight,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: COLORS.black },
  email: { fontSize: 13, color: COLORS.gray, marginTop: 2 },
  date: { fontSize: 12, color: COLORS.gray, marginTop: 4 },
  index: { fontSize: 14, fontWeight: '600', color: COLORS.gray },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, color: COLORS.gray, marginTop: 16 },
});

export default EnrollmentsListScreen;
