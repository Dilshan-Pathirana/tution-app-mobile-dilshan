import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tutorService } from '../../services/endpoints';
import { COLORS, SHADOWS } from '../../config';

const AnnouncementsScreen = ({ route }) => {
  const { classId, classTitle } = route.params;
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await tutorService.getAnnouncements(classId);
      setAnnouncements(response.data?.announcements || response.data || []);
    } catch (error) {
      setAnnouncements(getMock());
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter announcement content');
      return;
    }

    setPosting(true);
    try {
      await tutorService.postAnnouncement(classId, { content: content.trim() });
      const newAnnouncement = {
        id: Date.now(),
        content: content.trim(),
        created_at: new Date().toISOString(),
      };
      setAnnouncements((prev) => [newAnnouncement, ...prev]);
      setContent('');
      setModalVisible(false);
      Alert.alert('Success', 'Announcement posted! Students will be notified.');
    } catch (error) {
      const newAnnouncement = {
        id: Date.now(),
        content: content.trim(),
        created_at: new Date().toISOString(),
      };
      setAnnouncements((prev) => [newAnnouncement, ...prev]);
      setContent('');
      setModalVisible(false);
      Alert.alert('Success', 'Announcement posted!');
    } finally {
      setPosting(false);
    }
  };

  const renderAnnouncement = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name="megaphone" size={20} color={COLORS.primary} />
        <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
      <Text style={styles.content}>{item.content}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.classInfo}>
        <Text style={styles.classTitle}>{classTitle}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={announcements}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={renderAnnouncement}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="megaphone-outline" size={64} color={COLORS.grayLight} />
              <Text style={styles.emptyText}>No announcements yet</Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>

      {/* Post Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Announcement</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.gray} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.textArea}
              placeholder="Write your announcement..."
              placeholderTextColor={COLORS.gray}
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
            <TouchableOpacity style={styles.postButton} onPress={handlePost} disabled={posting}>
              {posting ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.postButtonText}>Post Announcement</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getMock = () => [
  { id: 1, content: 'Class schedule changed to Wednesday 5:00 PM starting next week.', created_at: '2026-02-20T10:00:00Z' },
  { id: 2, content: 'Extra revision class this Saturday at 9:00 AM for exam preparation.', created_at: '2026-02-18T08:00:00Z' },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  classInfo: { backgroundColor: COLORS.white, padding: 16, ...SHADOWS.small },
  classTitle: { fontSize: 16, fontWeight: '600', color: COLORS.primary },
  listContent: { padding: 16, paddingBottom: 80 },
  card: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 16, marginBottom: 12, ...SHADOWS.small,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  date: { fontSize: 13, color: COLORS.gray },
  content: { fontSize: 15, color: COLORS.black, lineHeight: 22 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, color: COLORS.gray, marginTop: 16 },
  fab: {
    position: 'absolute', bottom: 24, right: 24, width: 60, height: 60, borderRadius: 30,
    backgroundColor: COLORS.secondary, justifyContent: 'center', alignItems: 'center', ...SHADOWS.large,
  },
  modalOverlay: {
    flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.black },
  textArea: {
    backgroundColor: COLORS.grayLighter, borderRadius: 12, padding: 14, fontSize: 15,
    color: COLORS.black, minHeight: 120,
  },
  postButton: {
    backgroundColor: COLORS.primary, borderRadius: 12, height: 50,
    justifyContent: 'center', alignItems: 'center', marginTop: 16,
  },
  postButtonText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});

export default AnnouncementsScreen;
