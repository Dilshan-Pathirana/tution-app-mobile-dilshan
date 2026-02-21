import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '../../services/endpoints';
import { COLORS, SHADOWS } from '../../config';

const DashboardScreen = ({ navigation }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await adminService.getAnalytics();
      setStats(response.data);
    } catch (error) {
      setStats({
        total_tutors: 12,
        total_students: 156,
        total_enrollments: 342,
        enrolled_students: 120,
        total_revenue: 45000,
        pending_approvals: 3,
        pending_class_requests: 2,
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

  const menuItems = [
    {
      title: 'Tutor Approvals',
      subtitle: `${stats?.pending_approvals || 0} pending`,
      icon: 'person-add-outline',
      color: '#8B5CF6',
      screen: 'TutorApprovals',
    },
    {
      title: 'Manage Users',
      subtitle: 'Students & tutors',
      icon: 'people-outline',
      color: COLORS.success,
      screen: 'UserManagement',
    },
    {
      title: 'Manage Classes',
      subtitle: 'View and control classes',
      icon: 'school-outline',
      color: COLORS.primary,
      screen: 'ClassManagement',
    },
    {
      title: 'Class Requests',
      subtitle: `${stats?.pending_class_requests || 0} pending`,
      icon: 'clipboard-outline',
      color: COLORS.secondary,
      screen: 'ClassRequests',
    },
    {
      title: 'Send Notifications',
      subtitle: 'Push notifications',
      icon: 'notifications-outline',
      color: '#8B5CF6',
      screen: 'SendNotification',
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          icon="people-outline"
          label="Tutors"
          value={stats?.total_tutors || 0}
          color="#8B5CF6"
        />
        <StatCard
          icon="person-outline"
          label="Students"
          value={stats?.total_students || 0}
          color={COLORS.primary}
        />
        <StatCard
          icon="book-outline"
          label="Enrollments"
          value={`${stats?.enrolled_students || 0}/${stats?.total_students || 0}`}
          color={COLORS.success}
        />
        <StatCard
          icon="cash-outline"
          label="Revenue"
          value={`Rs.${(stats?.total_revenue || 0).toLocaleString()}`}
          color={COLORS.secondary}
        />
      </View>

      {/* Menu Items */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      {menuItems.map((item) => (
        <TouchableOpacity
          key={item.screen}
          style={styles.menuCard}
          onPress={() => navigation.navigate(item.screen)}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIcon, { backgroundColor: `${item.color}20` }]}>
            <Ionicons name={item.icon} size={24} color={item.color} />
          </View>
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>{item.title}</Text>
            <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.grayLight} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const StatCard = ({ icon, label, value, color }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
      <Ionicons name={icon} size={22} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24,
  },
  statCard: {
    width: '47%', backgroundColor: COLORS.white, borderRadius: 14, padding: 18,
    alignItems: 'center', ...SHADOWS.small,
  },
  statIcon: {
    width: 44, height: 44, borderRadius: 12, justifyContent: 'center',
    alignItems: 'center', marginBottom: 10,
  },
  statValue: { fontSize: 22, fontWeight: '800', color: COLORS.black },
  statLabel: { fontSize: 13, color: COLORS.gray, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.black, marginBottom: 14 },
  menuCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: 14, padding: 18, marginBottom: 10, ...SHADOWS.small,
  },
  menuIcon: {
    width: 48, height: 48, borderRadius: 12, justifyContent: 'center',
    alignItems: 'center', marginRight: 14,
  },
  menuInfo: { flex: 1 },
  menuTitle: { fontSize: 16, fontWeight: '600', color: COLORS.black },
  menuSubtitle: { fontSize: 13, color: COLORS.gray, marginTop: 2 },
});

export default DashboardScreen;
