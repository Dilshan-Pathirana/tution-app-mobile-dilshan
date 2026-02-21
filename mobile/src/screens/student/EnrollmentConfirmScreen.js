import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../config';

const EnrollmentConfirmScreen = ({ route, navigation }) => {
  const { classData } = route.params;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={80} color={COLORS.success} />
        </View>
        <Text style={styles.title}>Enrollment Successful!</Text>
        <Text style={styles.subtitle}>
          You have been enrolled in
        </Text>
        <Text style={styles.className}>{classData?.title}</Text>

        <View style={styles.detailsContainer}>
          <DetailRow icon="person-outline" text={classData?.tutor_name || 'Tutor'} />
          <DetailRow icon="calendar-outline" text={classData?.schedule || 'TBD'} />
          <DetailRow icon="location-outline" text={classData?.location || 'TBD'} />
        </View>

        <View style={styles.noteContainer}>
          <Ionicons name="information-circle-outline" size={18} color={COLORS.primary} />
          <Text style={styles.noteText}>
            Payment for this class is handled outside the app. Please contact the tutor for payment details.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.reviewButton}
          onPress={() => navigation.navigate('Review', {
            classId: classData?.id,
            classTitle: classData?.title,
          })}
        >
          <Ionicons name="star-outline" size={20} color={COLORS.primary} />
          <Text style={styles.reviewButtonText}>Write a Review</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => navigation.popToTop()}
        >
          <Text style={styles.homeButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const DetailRow = ({ icon, text }) => (
  <View style={styles.detailRow}>
    <Ionicons name={icon} size={18} color={COLORS.gray} />
    <Text style={styles.detailText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    ...SHADOWS.large,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.black,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.gray,
  },
  className: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 4,
    textAlign: 'center',
  },
  detailsContainer: {
    width: '100%',
    backgroundColor: COLORS.grayLighter,
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
    gap: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.primary,
    lineHeight: 18,
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 20,
    gap: 8,
  },
  reviewButtonText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  homeButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginTop: 12,
  },
  homeButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default EnrollmentConfirmScreen;
