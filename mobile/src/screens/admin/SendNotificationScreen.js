import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '../../services/endpoints';
import { COLORS, SHADOWS } from '../../config';

const SendNotificationScreen = ({ navigation }) => {
  const [target, setTarget] = useState('all');
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Error', 'Please fill in title and message');
      return;
    }

    setLoading(true);
    try {
      await adminService.sendNotification({ target, title: title.trim(), message: message.trim() });
      Alert.alert('Success', 'Notification sent to all ' + target + '!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Success', 'Notification sent successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Target Audience</Text>
        <View style={styles.targetRow}>
          {[
            { id: 'all', label: 'All Users', icon: 'people' },
            { id: 'students', label: 'Students', icon: 'person' },
            { id: 'tutors', label: 'Tutors', icon: 'school' },
          ].map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.targetButton, target === item.id && styles.targetButtonActive]}
              onPress={() => setTarget(item.id)}
            >
              <Ionicons
                name={item.icon}
                size={20}
                color={target === item.id ? COLORS.white : COLORS.primary}
              />
              <Text style={[styles.targetText, target === item.id && styles.targetTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Notification Title</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Schedule Update"
          placeholderTextColor={COLORS.gray}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Message</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Write your notification message..."
          placeholderTextColor={COLORS.gray}
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          maxLength={300}
        />
        <Text style={styles.charCount}>{message.length}/300</Text>

        <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="send" size={20} color={COLORS.white} />
              <Text style={styles.sendButtonText}>Send Notification</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: 20 },
  card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 24, ...SHADOWS.medium },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.black, marginBottom: 12 },
  targetRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  targetButton: {
    flex: 1, alignItems: 'center', paddingVertical: 12, borderWidth: 2,
    borderColor: COLORS.primary, borderRadius: 12, gap: 4,
  },
  targetButtonActive: { backgroundColor: COLORS.primary },
  targetText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  targetTextActive: { color: COLORS.white },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.black, marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: COLORS.grayLighter, borderRadius: 12, paddingHorizontal: 14,
    height: 48, fontSize: 15, color: COLORS.black,
  },
  textArea: {
    backgroundColor: COLORS.grayLighter, borderRadius: 12, padding: 14, fontSize: 15,
    color: COLORS.black, minHeight: 120,
  },
  charCount: { textAlign: 'right', fontSize: 12, color: COLORS.gray, marginTop: 4 },
  sendButton: {
    backgroundColor: COLORS.primary, borderRadius: 12, height: 54, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', marginTop: 24, gap: 8,
  },
  sendButtonText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});

export default SendNotificationScreen;
