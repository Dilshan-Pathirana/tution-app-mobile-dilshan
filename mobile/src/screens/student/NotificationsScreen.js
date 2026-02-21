import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { notificationService } from '../../services/endpoints';
import { COLORS, SHADOWS } from '../../config';

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await notificationService.getAll();
      setNotifications(response.data?.notifications || response.data || []);
    } catch (error) {
      // Use mock data
      setNotifications(getMockNotifications());
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, []);

  const markAsRead = async (id) => {
    try {
      await notificationService.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'announcement': return 'megaphone-outline';
      case 'schedule': return 'calendar-outline';
      case 'enrollment': return 'checkmark-circle-outline';
      default: return 'notifications-outline';
    }
  };

  const renderNotification = ({ item }) => (
    <TouchableOpacity
      style={[styles.notifCard, !item.read && styles.notifUnread]}
      onPress={() => markAsRead(item.id)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconCircle, { backgroundColor: item.read ? COLORS.grayLight : COLORS.primaryLight }]}>
        <Ionicons
          name={getIcon(item.type)}
          size={22}
          color={item.read ? COLORS.gray : COLORS.white}
        />
      </View>
      <View style={styles.notifContent}>
        <Text style={[styles.notifTitle, !item.read && styles.notifTitleUnread]}>{item.title}</Text>
        <Text style={styles.notifMessage} numberOfLines={2}>{item.message}</Text>
        <Text style={styles.notifTime}>{item.time || new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id?.toString()}
        renderItem={renderNotification}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={64} color={COLORS.grayLight} />
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        }
      />
    </View>
  );
};

const getMockNotifications = () => [
  {
    id: 1, type: 'announcement', title: 'New Announcement',
    message: 'Advanced Mathematics class schedule changed to Wednesday 5:00 PM.',
    time: '2 hours ago', read: false, created_at: '2026-02-21',
  },
  {
    id: 2, type: 'enrollment', title: 'Enrollment Confirmed',
    message: 'You have been enrolled in Science for Grade 10.',
    time: '1 day ago', read: true, created_at: '2026-02-20',
  },
  {
    id: 3, type: 'schedule', title: 'Schedule Update',
    message: 'English Literature class will have an extra session this Saturday.',
    time: '3 days ago', read: true, created_at: '2026-02-18',
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: 16,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    ...SHADOWS.small,
  },
  notifUnread: {
    backgroundColor: '#EEF2FF',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 4,
  },
  notifTitleUnread: {
    fontWeight: '700',
  },
  notifMessage: {
    fontSize: 13,
    color: COLORS.gray,
    lineHeight: 18,
  },
  notifTime: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 6,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    marginLeft: 8,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray,
    marginTop: 16,
  },
});

export default NotificationsScreen;
