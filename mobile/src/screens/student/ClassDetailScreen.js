import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { classService } from '../../services/endpoints';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, SHADOWS } from '../../config';

const ClassDetailScreen = ({ route, navigation }) => {
  const { classId, classData } = route.params;
  const [classInfo, setClassInfo] = useState(classData || null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(!classData);
  const { user } = useAuth();

  useEffect(() => {
    if (!classData) fetchClassDetail();
    fetchReviews();
  }, []);

  const fetchClassDetail = async () => {
    try {
      const response = await classService.getById(classId);
      setClassInfo(response.data);
    } catch (error) {
      console.log('Error fetching class detail:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await classService.getReviews(classId);
      setReviews(response.data?.reviews || response.data || []);
    } catch (error) {
      // Use mock reviews in dev
      setReviews(getMockReviews());
    }
  };

  const handleEnroll = async () => {
    Alert.alert(
      'Enroll in Class',
      `Do you want to enroll in "${classInfo.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Enroll',
          onPress: async () => {
            try {
              await classService.enroll(classId);
              navigation.navigate('EnrollmentConfirm', { classData: classInfo });
            } catch (error) {
              // Demo mode - navigate anyway
              navigation.navigate('EnrollmentConfirm', { classData: classInfo });
            }
          },
        },
      ]
    );
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= Math.round(rating) ? 'star' : 'star-outline'}
          size={16}
          color={COLORS.star}
        />
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!classInfo) {
    return (
      <View style={styles.centered}>
        <Text>Class not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Card */}
        <View style={styles.headerCard}>
          {classInfo.promotion && (
            <View style={styles.promotedBadge}>
              <Ionicons name="flash" size={14} color={COLORS.white} />
              <Text style={styles.promotedText}>Promoted</Text>
            </View>
          )}
          <Text style={styles.classTitle}>{classInfo.title}</Text>
          <View style={styles.ratingRow}>
            {renderStars(classInfo.rating || 0)}
            <Text style={styles.ratingText}>
              {classInfo.rating?.toFixed(1) || '0.0'} ({reviews.length} reviews)
            </Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Class Details</Text>
          <DetailRow icon="book-outline" label="Subject" value={classInfo.subject} />
          <DetailRow icon="school-outline" label="Grade" value={`Grade ${classInfo.grade}`} />
          <DetailRow icon="location-outline" label="Location" value={classInfo.location} />
          <DetailRow icon="calendar-outline" label="Schedule" value={classInfo.schedule} />
          <DetailRow icon="cash-outline" label="Price" value={classInfo.price ? `Rs. ${classInfo.price}/month` : 'Free'} />
        </View>

        {/* Description */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{classInfo.description || 'No description available.'}</Text>
        </View>

        {/* Tutor Info */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Tutor</Text>
          <View style={styles.tutorRow}>
            <View style={styles.tutorAvatar}>
              <Ionicons name="person" size={28} color={COLORS.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.tutorName}>{classInfo.tutor_name || 'Unknown Tutor'}</Text>
              <Text style={styles.tutorBio}>{classInfo.tutor_bio || 'Experienced tutor'}</Text>
            </View>
          </View>
        </View>

        {/* Reviews */}
        <View style={styles.detailsCard}>
          <View style={styles.reviewHeader}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Review', { classId, classTitle: classInfo.title })}
            >
              <Text style={styles.writeReview}>Write a Review</Text>
            </TouchableOpacity>
          </View>
          {reviews.length > 0 ? (
            reviews.map((review, index) => (
              <View key={review.id || index} style={styles.reviewItem}>
                <View style={styles.reviewTop}>
                  <Text style={styles.reviewerName}>{review.student_name || 'Student'}</Text>
                  <View style={{ flexDirection: 'row' }}>
                    {renderStars(review.rating)}
                  </View>
                </View>
                <Text style={styles.reviewText}>{review.review}</Text>
                <Text style={styles.reviewDate}>{review.created_at ? new Date(review.created_at).toLocaleDateString() : ''}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noReviews}>No reviews yet. Be the first!</Text>
          )}
        </View>
      </ScrollView>

      {/* Enroll Button */}
      <View style={styles.enrollContainer}>
        <View>
          <Text style={styles.enrollPrice}>
            {classInfo.price ? `Rs. ${classInfo.price}` : 'Free'}
          </Text>
          <Text style={styles.enrollPriceLabel}>per month</Text>
        </View>
        <TouchableOpacity style={styles.enrollButton} onPress={handleEnroll}>
          <Text style={styles.enrollButtonText}>Enroll Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const DetailRow = ({ icon, label, value }) => (
  <View style={styles.detailRow}>
    <Ionicons name={icon} size={18} color={COLORS.primary} />
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const getMockReviews = () => [
  { id: 1, student_name: 'Kamal', rating: 5, review: 'Excellent teaching methodology!', created_at: '2026-02-15' },
  { id: 2, student_name: 'Nimali', rating: 4, review: 'Very helpful for exam preparation.', created_at: '2026-02-10' },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCard: {
    backgroundColor: COLORS.primary,
    padding: 20,
    paddingTop: 10,
  },
  promotedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 4,
    marginBottom: 8,
  },
  promotedText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  classTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginLeft: 4,
  },
  detailsCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 14,
    padding: 18,
    ...SHADOWS.small,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.gray,
    width: 80,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
    flex: 1,
  },
  description: {
    fontSize: 15,
    color: COLORS.gray,
    lineHeight: 22,
  },
  tutorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  tutorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tutorName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
  },
  tutorBio: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  writeReview: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  reviewItem: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
    paddingBottom: 12,
    marginBottom: 12,
  },
  reviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
  },
  reviewText: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
  },
  reviewDate: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
  },
  noReviews: {
    fontSize: 14,
    color: COLORS.gray,
    fontStyle: 'italic',
  },
  enrollContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.grayLight,
    ...SHADOWS.medium,
  },
  enrollPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.black,
  },
  enrollPriceLabel: {
    fontSize: 12,
    color: COLORS.gray,
  },
  enrollButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 36,
    paddingVertical: 14,
  },
  enrollButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ClassDetailScreen;
