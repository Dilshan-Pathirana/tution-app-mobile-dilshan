import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '../../services/endpoints';
import { COLORS, SHADOWS } from '../../config';

const ROLES = [
  { key: 'student', label: 'Students' },
  { key: 'tutor', label: 'Tutors' },
];

const emptyForm = {
  name: '',
  email: '',
  contact_no: '',
  grade: '',
  password: '',
  role: 'student',
  is_approved: false,
  bio: '',
  subjects: '',
  location: '',
};

const UserManagementScreen = () => {
  const [role, setRole] = useState('student');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const title = useMemo(() => (role === 'tutor' ? 'Tutors' : 'Students'), [role]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminService.getUsers({
        role,
        ...(search.trim() ? { q: search.trim() } : {}),
        ...(gradeFilter.trim() ? { grade: gradeFilter.trim() } : {}),
      });
      setUsers(res.data || []);
    } catch (e) {
      setUsers([]);
      Alert.alert('Error', e.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const openCreate = () => {
    setEditingUser(null);
    setForm({ ...emptyForm, role });
    setModalVisible(true);
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setForm({
      ...emptyForm,
      role: user.role,
      name: user.name || '',
      email: user.email || '',
      contact_no: user.contact_no || '',
      grade: user.grade || '',
      password: '',
      is_approved: !!user.is_approved,
    });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingUser(null);
    setForm(emptyForm);
  };

  const save = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.contact_no.trim()) {
      Alert.alert('Error', 'Name, email, and contact number are required');
      return;
    }
    if (form.role === 'student' && !form.grade.trim()) {
      Alert.alert('Error', 'Grade is required for students');
      return;
    }
    if (!editingUser && (!form.password || form.password.length < 6)) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setSaving(true);
    try {
      if (editingUser) {
        await adminService.updateUser(editingUser.id, {
          name: form.name.trim(),
          email: form.email.trim(),
          contact_no: form.contact_no.trim(),
          ...(form.role === 'student' ? { grade: form.grade.trim() } : {}),
          ...(form.password ? { password: form.password } : {}),
          ...(form.role === 'tutor' ? { is_approved: !!form.is_approved } : {}),
          ...(form.role === 'tutor'
            ? {
                bio: form.bio || undefined,
                subjects: form.subjects || undefined,
                location: form.location || undefined,
              }
            : {}),
        });
      } else {
        await adminService.createUser({
          name: form.name.trim(),
          email: form.email.trim(),
          contact_no: form.contact_no.trim(),
          ...(form.role === 'student' ? { grade: form.grade.trim() } : {}),
          password: form.password,
          role: form.role,
          ...(form.role === 'tutor' ? { is_approved: !!form.is_approved } : {}),
          ...(form.role === 'tutor'
            ? {
                bio: form.bio || undefined,
                subjects: form.subjects || undefined,
                location: form.location || undefined,
              }
            : {}),
        });
      }
      closeModal();
      await fetchUsers();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const remove = (user) => {
    Alert.alert('Delete User', `Delete ${user.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await adminService.deleteUser(user.id);
            setUsers((prev) => prev.filter((u) => u.id !== user.id));
          } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Delete failed');
          }
        },
      },
    ]);
  };

  const renderUser = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.email}>{item.email}</Text>
          {item.role === 'tutor' && (
            <View style={styles.chips}>
              <View style={[styles.chip, item.is_approved ? styles.chipOk : styles.chipWarn]}>
                <Text style={[styles.chipText, item.is_approved ? styles.chipOkText : styles.chipWarnText]}>
                  {item.is_approved ? 'Approved' : 'Pending'}
                </Text>
              </View>
            </View>
          )}
        </View>

        <TouchableOpacity onPress={() => openEdit(item)} style={styles.iconBtn}>
          <Ionicons name="create-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => remove(item)} style={styles.iconBtn}>
          <Ionicons name="trash-outline" size={20} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <Ionicons name="add" size={18} color={COLORS.white} />
          <Text style={styles.addText}>Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {ROLES.map((r) => (
          <TouchableOpacity
            key={r.key}
            style={[styles.tab, role === r.key && styles.tabActive]}
            onPress={() => setRole(r.key)}
          >
            <Text style={[styles.tabText, role === r.key && styles.tabTextActive]}>{r.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.filters}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search name or email"
          placeholderTextColor={COLORS.gray}
          style={[styles.filterInput, { flex: 1 }]}
          autoCapitalize="none"
        />
        {role === 'student' && (
          <TextInput
            value={gradeFilter}
            onChangeText={setGradeFilter}
            placeholder="Grade"
            placeholderTextColor={COLORS.gray}
            style={[styles.filterInput, { width: 90 }]}
          />
        )}
        <TouchableOpacity style={styles.applyBtn} onPress={fetchUsers}>
          <Ionicons name="search" size={16} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={renderUser}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={64} color={COLORS.grayLight} />
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          }
        />
      )}

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingUser ? 'Edit User' : 'Add User'}</Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color={COLORS.gray} />
              </TouchableOpacity>
            </View>

            <Field label="Name" value={form.name} onChangeText={(v) => setForm((p) => ({ ...p, name: v }))} />
            <Field label="Email" value={form.email} onChangeText={(v) => setForm((p) => ({ ...p, email: v }))} autoCapitalize="none" />
            <Field label="Contact No." value={form.contact_no} onChangeText={(v) => setForm((p) => ({ ...p, contact_no: v }))} keyboardType="phone-pad" />
            {form.role === 'student' && (
              <Field label="Grade" value={form.grade} onChangeText={(v) => setForm((p) => ({ ...p, grade: v }))} />
            )}
            {!editingUser && (
              <Field
                label="Password"
                value={form.password}
                onChangeText={(v) => setForm((p) => ({ ...p, password: v }))}
                secureTextEntry
              />
            )}

            {form.role === 'tutor' && (
              <>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Approved</Text>
                  <TouchableOpacity
                    style={[styles.toggle, form.is_approved && styles.toggleOn]}
                    onPress={() => setForm((p) => ({ ...p, is_approved: !p.is_approved }))}
                  >
                    <View style={[styles.toggleDot, form.is_approved && styles.toggleDotOn]} />
                  </TouchableOpacity>
                </View>
                <Field label="Subjects" value={form.subjects} onChangeText={(v) => setForm((p) => ({ ...p, subjects: v }))} />
                <Field label="Location" value={form.location} onChangeText={(v) => setForm((p) => ({ ...p, location: v }))} />
                <Field label="Bio" value={form.bio} onChangeText={(v) => setForm((p) => ({ ...p, bio: v }))} multiline />
              </>
            )}

            <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving}>
              {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveText}>Save</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const Field = ({ label, value, onChangeText, ...props }) => (
  <View style={{ marginTop: 12 }}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      style={[styles.input, props.multiline && { height: 80, textAlignVertical: 'top' }]}
      placeholder={label}
      placeholderTextColor={COLORS.gray}
      {...props}
    />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topBar: {
    padding: 16,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.small,
  },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.black },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addText: { color: COLORS.white, fontWeight: '700' },
  tabs: { flexDirection: 'row', gap: 10, padding: 16 },
  filters: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 6,
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
  tab: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.grayLight,
  },
  tabActive: { borderColor: COLORS.primary },
  tabText: { color: COLORS.gray, fontWeight: '700' },
  tabTextActive: { color: COLORS.primary },
  card: { backgroundColor: COLORS.white, borderRadius: 14, padding: 16, marginBottom: 10, ...SHADOWS.small },
  row: { flexDirection: 'row', alignItems: 'center' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: COLORS.black },
  email: { fontSize: 13, color: COLORS.gray, marginTop: 4 },
  iconBtn: { padding: 8 },
  chips: { flexDirection: 'row', gap: 8, marginTop: 8 },
  chip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  chipText: { fontSize: 11, fontWeight: '700' },
  chipOk: { backgroundColor: '#DCFCE7' },
  chipOkText: { color: '#166534' },
  chipWarn: { backgroundColor: '#FEF3C7' },
  chipWarnText: { color: '#92400E' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, color: COLORS.gray, marginTop: 16 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.white, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 16, fontWeight: '800', color: COLORS.black },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: COLORS.black, marginBottom: 6 },
  input: { backgroundColor: COLORS.grayLighter, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: COLORS.black },
  saveBtn: { marginTop: 16, backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveText: { color: COLORS.white, fontWeight: '800' },

  switchRow: { marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchLabel: { fontSize: 13, fontWeight: '700', color: COLORS.black },
  toggle: { width: 50, height: 28, borderRadius: 14, backgroundColor: COLORS.grayLight, padding: 3, justifyContent: 'center' },
  toggleOn: { backgroundColor: '#DCFCE7' },
  toggleDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.white, alignSelf: 'flex-start' },
  toggleDotOn: { alignSelf: 'flex-end' },
});

export default UserManagementScreen;
