import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '../../services/endpoints';
import { COLORS, SHADOWS } from '../../config';

const AddEditClassScreen = ({ route, navigation }) => {
  const { mode, classData } = route.params || {};
  const isEdit = mode === 'edit';

  const [tutorId, setTutorId] = useState('');
  const [title, setTitle] = useState(classData?.title || '');
  const [subject, setSubject] = useState(classData?.subject || '');
  const [grade, setGrade] = useState(classData?.grade?.toString() || '');
  const [schedule, setSchedule] = useState(classData?.schedule || '');
  const [location, setLocation] = useState(classData?.location || '');
  const [price, setPrice] = useState(classData?.price?.toString() || '');
  const [description, setDescription] = useState(classData?.description || '');
  const [loading, setLoading] = useState(false);

  const headerTitle = useMemo(() => (isEdit ? 'Edit Class' : 'Add Class'), [isEdit]);

  React.useLayoutEffect(() => {
    navigation.setOptions({ title: headerTitle });
  }, [navigation, headerTitle]);

  const handleSubmit = async () => {
    if (!title.trim() || !subject.trim() || !grade.trim() || !schedule.trim() || !location.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    if (!isEdit && !tutorId.trim()) {
      Alert.alert('Error', 'Tutor ID is required to create a class');
      return;
    }

    const data = {
      title: title.trim(),
      subject: subject.trim(),
      grade: grade.trim(),
      schedule: schedule.trim(),
      location: location.trim(),
      price: price ? parseFloat(price) : 0,
      description: description.trim(),
    };

    setLoading(true);
    try {
      if (isEdit) {
        await adminService.updateClass(classData.id, data);
        Alert.alert('Success', 'Class updated', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      } else {
        await adminService.createClass({ tutor_id: parseInt(tutorId, 10), ...data });
        Alert.alert('Success', 'Class created', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          {!isEdit && (
            <>
              <Text style={styles.label}>Tutor ID *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={18} color={COLORS.gray} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 2"
                  placeholderTextColor={COLORS.gray}
                  value={tutorId}
                  onChangeText={setTutorId}
                  keyboardType="numeric"
                />
              </View>
            </>
          )}

          <FormField label="Class Title *" icon="book" placeholder="e.g. Advanced Mathematics" value={title} onChangeText={setTitle} />
          <FormField label="Subject *" icon="library-outline" placeholder="e.g. Mathematics" value={subject} onChangeText={setSubject} />
          <FormField label="Grade *" icon="school-outline" placeholder="e.g. 11" value={grade} onChangeText={setGrade} keyboardType="numeric" />
          <FormField label="Schedule *" icon="calendar-outline" placeholder="e.g. Mon 4:00 PM" value={schedule} onChangeText={setSchedule} />
          <FormField label="Location *" icon="location-outline" placeholder="e.g. Colombo" value={location} onChangeText={setLocation} />
          <FormField label="Price" icon="cash-outline" placeholder="e.g. 3000" value={price} onChangeText={setPrice} keyboardType="numeric" />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Description"
            placeholderTextColor={COLORS.gray}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.submitButtonText}>{isEdit ? 'Update' : 'Create'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const FormField = ({ label, icon, placeholder, value, onChangeText, keyboardType }) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputContainer}>
      <Ionicons name={icon} size={18} color={COLORS.gray} style={styles.inputIcon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={COLORS.gray}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: 20 },
  form: { backgroundColor: COLORS.white, borderRadius: 16, padding: 20, ...SHADOWS.medium },
  fieldContainer: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.black, marginBottom: 8, marginTop: 10 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.grayLighter,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: COLORS.black },
  textArea: {
    backgroundColor: COLORS.grayLighter,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: COLORS.black,
    minHeight: 100,
    marginBottom: 8,
  },
  submitButton: { backgroundColor: COLORS.primary, borderRadius: 12, height: 50, justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  submitButtonText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});

export default AddEditClassScreen;
