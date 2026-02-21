import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '../../services/endpoints';
import { COLORS, SHADOWS } from '../../config';

const ClassManagementScreen = ({ navigation }) => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [grade, setGrade] = useState('');
  const [location, setLocation] = useState('');
  const [tutor, setTutor] = useState('');

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await adminService.getAllClasses({
        ...(search.trim() ? { q: search.trim() } : {}),
        ...(grade.trim() ? { grade: grade.trim() } : {}),
        ...(location.trim() ? { location: location.trim() } : {}),
        ...(tutor.trim() ? { tutor: tutor.trim() } : {}),
      });
      setClasses(response.data?.classes || response.data || []);
    } catch (error) {
      setClasses(getMock());
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id, title) => {
    Alert.alert('Delete Class', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try { await adminService.deleteClass(id); } catch (e) {}
          setClasses((prev) => prev.filter((c) => c.id !== id));
        },
      },
    ]);
  };

  const renderClass = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <View style={styles.cardInfo}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.detail}>Tutor: {item.tutor_name || 'N/A'}</Text>
          <Text style={styles.detail}>
            {item.subject} | Grade {item.grade} | {item.location}
          </Text>
          <View style={styles.chips}>
            {item.promotion && (
              <View style={styles.promotedChip}>
                <Text style={styles.promotedChipText}>Promoted</Text>
              </View>
            )}
            <View style={styles.enrollChip}>
              <Text style={styles.enrollChipText}>{item.enrollment_count || 0} students</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.navigate('AdminAddEditClass', { mode: 'edit', classData: item })}
        >
          <Ionicons name="create-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(item.id, item.title)}>
          <Ionicons name="trash-outline" size={20} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) return <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>{classes.length} total classes</Text>
      </View>

      <View style={styles.filters}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search title/subject"
          placeholderTextColor={COLORS.gray}
          style={[styles.filterInput, { flex: 1 }]}
        />
        <TouchableOpacity style={styles.applyBtn} onPress={fetchClasses}>
          <Ionicons name="search" size={16} color={COLORS.white} />
        </TouchableOpacity>
      </View>
      <View style={styles.filters}>
        <TextInput
          value={grade}
          onChangeText={setGrade}
          placeholder="Grade"
          placeholderTextColor={COLORS.gray}
          style={[styles.filterInput, { width: 90 }]}
        />
        <TextInput
          value={tutor}
          onChangeText={setTutor}
          placeholder="Tutor"
          placeholderTextColor={COLORS.gray}
          style={[styles.filterInput, { flex: 1 }]}
        />
        <TextInput
          value={location}
          onChangeText={setLocation}
          placeholder="Location"
          placeholderTextColor={COLORS.gray}
          style={[styles.filterInput, { flex: 1 }]}
        />
      </View>

      <FlatList
        data={classes}
        keyExtractor={(item) => item.id?.toString()}
        renderItem={renderClass}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="school-outline" size={64} color={COLORS.grayLight} />
            <Text style={styles.emptyText}>No classes found</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AdminAddEditClass', { mode: 'create' })}
      >
        <Ionicons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
};

const getMock = () => [
  { id: 1, title: 'Advanced Mathematics - O/L', tutor_name: 'Mr. Perera', subject: 'Mathematics', grade: '11', location: 'Colombo', promotion: true, enrollment_count: 25 },
  { id: 2, title: 'Science for Grade 10', tutor_name: 'Ms. Fernando', subject: 'Science', grade: '10', location: 'Kandy', promotion: false, enrollment_count: 18 },
  { id: 3, title: 'English Literature A/L', tutor_name: 'Dr. Silva', subject: 'English', grade: '12', location: 'Galle', promotion: false, enrollment_count: 12 },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.white, padding: 16, ...SHADOWS.small },
  headerText: { fontSize: 14, color: COLORS.gray, fontWeight: '500' },
  filters: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    alignItems: 'center',
  },
  filterInput: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.grayLight,
    color: COLORS.black,
  },
  applyBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: { padding: 16 },
  card: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 16, marginBottom: 10, ...SHADOWS.small,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  cardInfo: { flex: 1 },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.black, marginBottom: 4 },
  detail: { fontSize: 13, color: COLORS.gray, marginBottom: 2 },
  chips: { flexDirection: 'row', gap: 8, marginTop: 8 },
  promotedChip: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  promotedChipText: { fontSize: 11, fontWeight: '600', color: '#92400E' },
  enrollChip: { backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  enrollChipText: { fontSize: 11, fontWeight: '600', color: COLORS.primary },
  deleteBtn: { padding: 8 },
  iconBtn: { padding: 8 },
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, color: COLORS.gray, marginTop: 16 },
});

export default ClassManagementScreen;
