import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '../../services/endpoints';
import { COLORS, SHADOWS } from '../../config';

const ClassRequestsScreen = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await adminService.getClassRequests({ status: 'pending' });
      setRequests(res.data || []);
    } catch (e) {
      setRequests([]);
      Alert.alert('Error', e.response?.data?.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const approve = (req) => {
    Alert.alert('Approve Request', `Approve "${req.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: async () => {
          try {
            await adminService.approveClassRequest(req.id);
            setRequests((prev) => prev.filter((r) => r.id !== req.id));
          } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Approve failed');
          }
        },
      },
    ]);
  };

  const reject = (req) => {
    Alert.alert('Reject Request', `Reject "${req.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          try {
            await adminService.rejectClassRequest(req.id, {});
            setRequests((prev) => prev.filter((r) => r.id !== req.id));
          } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Reject failed');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.meta}>Tutor: {item.tutor_name || item.tutor_email || 'N/A'}</Text>
      <Text style={styles.meta}>{item.subject} | Grade {item.grade} | {item.location}</Text>
      <Text style={styles.meta}>Schedule: {item.schedule}</Text>
      <Text style={styles.meta}>Price: Rs. {item.price}</Text>
      {!!item.description && <Text style={styles.desc}>{item.description}</Text>}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.rejectBtn} onPress={() => reject(item)}>
          <Ionicons name="close" size={18} color={COLORS.error} />
          <Text style={styles.rejectText}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.approveBtn} onPress={() => approve(item)}>
          <Ionicons name="checkmark" size={18} color={COLORS.white} />
          <Text style={styles.approveText}>Approve</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) return <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id?.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="checkmark-done-circle-outline" size={64} color={COLORS.success} />
            <Text style={styles.emptyText}>No pending class requests</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  card: { backgroundColor: COLORS.white, borderRadius: 14, padding: 16, marginBottom: 12, ...SHADOWS.small },
  title: { fontSize: 16, fontWeight: '800', color: COLORS.black, marginBottom: 6 },
  meta: { fontSize: 13, color: COLORS.gray, marginTop: 2 },
  desc: { marginTop: 10, fontSize: 14, color: COLORS.black },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10, paddingVertical: 10, borderWidth: 1, borderColor: COLORS.error },
  rejectText: { color: COLORS.error, fontWeight: '800' },
  approveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10, paddingVertical: 10, backgroundColor: COLORS.success },
  approveText: { color: COLORS.white, fontWeight: '800' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, color: COLORS.gray, marginTop: 16 },
});

export default ClassRequestsScreen;
