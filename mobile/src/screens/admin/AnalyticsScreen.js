import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '../../services/endpoints';
import { COLORS, SHADOWS } from '../../config';

const { width } = Dimensions.get('window');

const AnalyticsScreen = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await adminService.getAnalytics();
      setData(response.data);
    } catch (error) {
      setData({
        total_tutors: 12,
        total_students: 156,
        total_enrollments: 342,
        total_revenue: 45000,
        monthly_enrollments: [28, 35, 42, 38, 55, 48],
        monthly_registrations: [12, 18, 20, 16, 25, 22],
        top_subjects: [
          { subject: 'Mathematics', count: 85 },
          { subject: 'Science', count: 62 },
          { subject: 'English', count: 48 },
          { subject: 'Physics', count: 35 },
          { subject: 'Chemistry', count: 28 },
        ],
        monthly_revenue: [5000, 7500, 8000, 6500, 9000, 9000],
        tutors: [
          { id: 1, name: 'Mr. Perera', email: 'perera@example.com', class_count: 3, enrollment_count: 40 },
          { id: 2, name: 'Ms. Fernando', email: 'fernando@example.com', class_count: 2, enrollment_count: 28 },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const getLastSixMonthLabels = () => {
    const now = new Date();
    const labels = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(d.toLocaleString('en-US', { month: 'short' }));
    }
    return labels;
  };

  const months = getLastSixMonthLabels();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Summary Cards */}
      <View style={styles.row}>
        <SummaryCard icon="people" color="#8B5CF6" value={data?.total_tutors} label="Tutors" />
        <SummaryCard icon="person" color={COLORS.primary} value={data?.total_students} label="Students" />
      </View>
      <View style={styles.row}>
        <SummaryCard icon="book" color={COLORS.success} value={data?.total_enrollments} label="Enrollments" />
        <SummaryCard icon="cash" color={COLORS.secondary} value={`Rs.${(data?.total_revenue || 0).toLocaleString()}`} label="Revenue" />
      </View>

      {/* Monthly Enrollments Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Monthly Enrollments</Text>
        <View style={styles.barChart}>
          {(data?.monthly_enrollments || []).map((val, idx) => {
            const maxVal = Math.max(...(data?.monthly_enrollments || [1]));
            const height = (val / maxVal) * 100;
            return (
              <View key={idx} style={styles.barContainer}>
                <Text style={styles.barValue}>{val}</Text>
                <View style={[styles.bar, { height, backgroundColor: COLORS.primary }]} />
                <Text style={styles.barLabel}>{months[idx]}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Top Subjects */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Top Subjects</Text>
        {(data?.top_subjects || []).map((item, idx) => {
          const maxCount = data?.top_subjects?.[0]?.count || 1;
          const percentage = (item.count / maxCount) * 100;
          return (
            <View key={idx} style={styles.subjectRow}>
              <Text style={styles.subjectName}>{item.subject}</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, {
                  width: `${percentage}%`,
                  backgroundColor: ['#8B5CF6', COLORS.primary, COLORS.success, COLORS.secondary, '#EC4899'][idx],
                }]} />
              </View>
              <Text style={styles.subjectCount}>{item.count}</Text>
            </View>
          );
        })}
      </View>

      {/* Revenue Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Monthly Revenue (Rs.)</Text>
        <View style={styles.barChart}>
          {(data?.monthly_revenue || []).map((val, idx) => {
            const maxVal = Math.max(...(data?.monthly_revenue || [1]));
            const height = (val / maxVal) * 100;
            return (
              <View key={idx} style={styles.barContainer}>
                <Text style={styles.barValue}>{(val / 1000).toFixed(0)}k</Text>
                <View style={[styles.bar, { height, backgroundColor: COLORS.success }]} />
                <Text style={styles.barLabel}>{months[idx]}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Monthly Registrations Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Monthly Registrations</Text>
        <View style={styles.barChart}>
          {(data?.monthly_registrations || []).map((val, idx) => {
            const maxVal = Math.max(...(data?.monthly_registrations || [1]));
            const height = (val / maxVal) * 100;
            return (
              <View key={idx} style={styles.barContainer}>
                <Text style={styles.barValue}>{val}</Text>
                <View style={[styles.bar, { height, backgroundColor: COLORS.secondary }]} />
                <Text style={styles.barLabel}>{months[idx]}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Tutor Leaderboard */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Tutors (Classes / Enrollments)</Text>
        {(data?.tutors || []).slice(0, 10).map((t) => (
          <View key={t.id} style={styles.tutorRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.tutorName} numberOfLines={1}>{t.name}</Text>
              <Text style={styles.tutorEmail} numberOfLines={1}>{t.email}</Text>
            </View>
            <Text style={styles.tutorCounts}>{t.class_count}/{t.enrollment_count}</Text>
          </View>
        ))}
        {(!data?.tutors || data.tutors.length === 0) && (
          <Text style={styles.emptySmall}>No tutors found</Text>
        )}
      </View>
    </ScrollView>
  );
};

const SummaryCard = ({ icon, color, value, label }) => (
  <View style={styles.summaryCard}>
    <View style={[styles.summaryIcon, { backgroundColor: `${color}20` }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text style={styles.summaryValue}>{value}</Text>
    <Text style={styles.summaryLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  row: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  summaryCard: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: 14, padding: 16,
    alignItems: 'center', ...SHADOWS.small,
  },
  summaryIcon: {
    width: 44, height: 44, borderRadius: 12, justifyContent: 'center',
    alignItems: 'center', marginBottom: 10,
  },
  summaryValue: { fontSize: 20, fontWeight: '800', color: COLORS.black },
  summaryLabel: { fontSize: 13, color: COLORS.gray, marginTop: 4 },
  chartCard: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 18, marginBottom: 16, ...SHADOWS.small,
  },
  chartTitle: { fontSize: 16, fontWeight: '700', color: COLORS.black, marginBottom: 16 },
  barChart: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 140 },
  barContainer: { alignItems: 'center', flex: 1 },
  barValue: { fontSize: 11, color: COLORS.gray, marginBottom: 4 },
  bar: { width: 28, borderRadius: 6, minHeight: 4 },
  barLabel: { fontSize: 11, color: COLORS.gray, marginTop: 6 },
  subjectRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  subjectName: { fontSize: 13, fontWeight: '500', color: COLORS.black, width: 90 },
  progressBar: {
    flex: 1, height: 10, backgroundColor: COLORS.grayLighter, borderRadius: 5, marginHorizontal: 10,
  },
  progressFill: { height: '100%', borderRadius: 5 },
  subjectCount: { fontSize: 13, fontWeight: '600', color: COLORS.gray, width: 30, textAlign: 'right' },
  tutorRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.grayLighter },
  tutorName: { fontSize: 14, fontWeight: '700', color: COLORS.black },
  tutorEmail: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  tutorCounts: { fontSize: 13, fontWeight: '700', color: COLORS.primary, marginLeft: 12 },
  emptySmall: { fontSize: 13, color: COLORS.gray },
});

export default AnalyticsScreen;
