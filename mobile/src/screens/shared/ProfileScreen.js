import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/endpoints';
import { COLORS, SHADOWS } from '../../config';

const ProfileScreen = () => {
  const { user, logout, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

  const initials = useMemo(() => (user?.name || 'U')[0].toUpperCase(), [user?.name]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Error', 'Email cannot be empty');
      return;
    }
    setSaving(true);
    try {
      const res = await authService.updateProfile({ name: name.trim(), email: email.trim() });
      await updateUser({ ...user, name: res.data?.name || name.trim(), email: res.data?.email || email.trim() });
      setIsEditing(false);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        {isEditing ? (
          <TextInput
            value={name}
            onChangeText={setName}
            style={styles.nameInput}
            placeholder="Your name"
            placeholderTextColor={COLORS.gray}
          />
        ) : (
          <Text style={styles.name}>{user?.name || 'User'}</Text>
        )}
        {isEditing ? (
          <TextInput
            value={email}
            onChangeText={setEmail}
            style={styles.emailInput}
            placeholder="you@example.com"
            placeholderTextColor={COLORS.gray}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        ) : (
          <Text style={styles.email}>{user?.email || ''}</Text>
        )}
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role?.toUpperCase() || 'STUDENT'}</Text>
        </View>

        <TouchableOpacity
          style={[styles.editBtn, isEditing && styles.editBtnActive]}
          onPress={isEditing ? handleSave : () => setIsEditing(true)}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name={isEditing ? 'checkmark' : 'create-outline'} size={18} color={COLORS.white} />
              <Text style={styles.editBtnText}>{isEditing ? 'Save' : 'Edit'}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Info Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account Information</Text>
        <InfoRow icon="person-outline" label="Name" value={user?.name || 'N/A'} />
        <InfoRow icon="mail-outline" label="Email" value={user?.email || 'N/A'} />
        <InfoRow icon="shield-outline" label="Role" value={user?.role || 'N/A'} />
        <InfoRow icon="calendar-outline" label="Member Since" value="February 2026" />
      </View>

      {/* Settings */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Settings</Text>
        <SettingRow icon="notifications-outline" label="Notifications" />
        <SettingRow icon="moon-outline" label="Dark Mode" />
        <SettingRow icon="language-outline" label="Language" />
        <SettingRow icon="help-circle-outline" label="Help & Support" />
        <SettingRow icon="document-text-outline" label="Terms & Conditions" />
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Text style={styles.version}>TutorBooking v1.0.0</Text>
    </ScrollView>
  );
};

const InfoRow = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <Ionicons name={icon} size={18} color={COLORS.primary} />
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const SettingRow = ({ icon, label }) => (
  <TouchableOpacity style={styles.settingRow}>
    <Ionicons name={icon} size={20} color={COLORS.gray} />
    <Text style={styles.settingLabel}>{label}</Text>
    <Ionicons name="chevron-forward" size={18} color={COLORS.grayLight} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: 20, paddingBottom: 40 },
  avatarContainer: { alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: COLORS.white },
  name: { fontSize: 20, fontWeight: '700', color: COLORS.black },
  nameInput: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.black,
    backgroundColor: COLORS.grayLighter,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 240,
    textAlign: 'center',
  },
  email: { fontSize: 14, color: COLORS.gray, marginTop: 4 },
  emailInput: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.black,
    backgroundColor: COLORS.grayLighter,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 260,
    textAlign: 'center',
  },
  roleBadge: {
    backgroundColor: '#EEF2FF', paddingHorizontal: 14, paddingVertical: 4,
    borderRadius: 20, marginTop: 8,
  },
  roleText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  editBtn: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  editBtnActive: {
    backgroundColor: COLORS.success,
  },
  editBtnText: { color: COLORS.white, fontWeight: '800' },
  card: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 18, marginBottom: 16, ...SHADOWS.small,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.black, marginBottom: 14 },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: COLORS.grayLighter, gap: 10,
  },
  infoLabel: { fontSize: 14, color: COLORS.gray, width: 100 },
  infoValue: { fontSize: 14, fontWeight: '600', color: COLORS.black, flex: 1 },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.grayLighter, gap: 12,
  },
  settingLabel: { flex: 1, fontSize: 15, color: COLORS.black },
  logoutButton: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: 14, padding: 16, marginTop: 8, gap: 8,
    borderWidth: 1, borderColor: COLORS.error,
  },
  logoutText: { fontSize: 16, fontWeight: '600', color: COLORS.error },
  version: { textAlign: 'center', fontSize: 12, color: COLORS.gray, marginTop: 20 },
});

export default ProfileScreen;
