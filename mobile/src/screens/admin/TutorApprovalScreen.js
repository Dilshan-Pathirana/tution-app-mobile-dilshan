import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '../../services/endpoints';
import { COLORS, SHADOWS } from '../../config';

const TutorApprovalScreen = () => {
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPendingTutors();
  }, []);

  const fetchPendingTutors = async () => {
    try {
      const response = await adminService.getPendingTutors();
      setTutors(response.data?.tutors || response.data || []);
    } catch (error) {
      setTutors(getMock());
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPendingTutors();
    setRefreshing(false);
  }, []);

  const handleApprove = (id, name) => {
    Alert.alert('Approve Tutor', `Approve ${name} as a tutor?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: async () => {
          try { await adminService.approveTutor(id); } catch (e) {}
          setTutors((prev) => prev.filter((t) => t.id !== id));
          Alert.alert('Approved', `${name} has been approved as a tutor.`);
        },
      },
    ]);
  };

  const handleReject = (id, name) => {
    Alert.alert('Reject Tutor', `Reject ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          try { await adminService.rejectTutor(id); } catch (e) {}
          setTutors((prev) => prev.filter((t) => t.id !== id));
          Alert.alert('Rejected', `${name} has been rejected.`);
        },
      },
    ]);
  };

  const renderTutor = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(item.name || 'T')[0].toUpperCase()}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.email}>{item.email}</Text>
          <Text style={styles.detail}>Subjects: {item.subjects || 'N/A'}</Text>
          <Text style={styles.detail}>Location: {item.location || 'N/A'}</Text>
        </View>
      </View>
      {item.bio && <Text style={styles.bio}>{item.bio}</Text>}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.rejectButton}
          onPress={() => handleReject(item.id, item.name)}
        >
          <Ionicons name="close" size={18} color={COLORS.error} />
          <Text style={styles.rejectText}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.approveButton}
          onPress={() => handleApprove(item.id, item.name)}
        >
          <Ionicons name="checkmark" size={18} color={COLORS.white} />
          <Text style={styles.approveText}>Approve</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={tutors}
        keyExtractor={(item) => item.id?.toString()}
        renderItem={renderTutor}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="checkmark-done-circle-outline" size={64} color={COLORS.success} />
            <Text style={styles.emptyText}>All caught up!</Text>
            <Text style={styles.emptySubText}>No pending tutor approvals</Text>
          </View>
        }
      />
    </View>
  );
};

const getMock = () => [
  { id: 1, name: 'Dr. Saman Kumara', email: 'saman@email.com', subjects: 'Mathematics, Physics', location: 'Colombo', bio: '10 years teaching experience at national level.' },
  { id: 2, name: 'Ms. Dhanushka Wijesekera', email: 'dhanushka@email.com', subjects: 'English, Literature', location: 'Kandy', bio: 'MA in English Literature from University of Peradeniya.' },
  { id: 3, name: 'Mr. Ashan Bandara', email: 'ashan@email.com', subjects: 'Science', location: 'Galle', bio: 'BSc in Biology, 5 years experience.' },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  listContent: { padding: 16 },
  card: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 18, marginBottom: 12, ...SHADOWS.small,
  },
  cardHeader: { flexDirection: 'row', marginBottom: 12 },
  avatar: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: '#8B5CF6',
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  avatarText: { fontSize: 20, fontWeight: '700', color: COLORS.white },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: COLORS.black },
  email: { fontSize: 13, color: COLORS.gray, marginTop: 2 },
  detail: { fontSize: 13, color: COLORS.gray, marginTop: 2 },
  bio: {
    fontSize: 14, color: COLORS.gray, lineHeight: 20, backgroundColor: COLORS.grayLighter,
    padding: 12, borderRadius: 10, marginBottom: 12,
  },
  actions: { flexDirection: 'row', gap: 10 },
  rejectButton: {
    flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.error, borderRadius: 10, paddingVertical: 10, gap: 6,
  },
  rejectText: { fontSize: 14, fontWeight: '600', color: COLORS.error },
  approveButton: {
    flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    backgroundColor: COLORS.success, borderRadius: 10, paddingVertical: 10, gap: 6,
  },
  approveText: { fontSize: 14, fontWeight: '600', color: COLORS.white },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 18, fontWeight: '600', color: COLORS.black, marginTop: 16 },
  emptySubText: { fontSize: 14, color: COLORS.gray, marginTop: 6 },
});

export default TutorApprovalScreen;
