import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useAuth } from './AuthContext';
import { notificationService } from '../services/endpoints';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notifications, setNotifications] = useState([]);
  const notificationListener = useRef();
  const responseListener = useRef();
  const hasAttemptedRegister = useRef(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      if (!hasAttemptedRegister.current) {
        hasAttemptedRegister.current = true;
        registerForPushNotifications();
      }
    }

    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        setNotifications((prev) => [notification, ...prev]);
      }
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification tapped:', response);
      }
    );

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [isAuthenticated]);

  const registerForPushNotifications = async () => {
    try {
      if (!Device.isDevice) {
        console.log('Push notifications require a physical device');
        return;
      }

      // Expo push token may require a valid EAS projectId in some setups.
      // If it's not present/valid, we'll try without it and gracefully handle errors.
      const projectId = Constants.easConfig?.projectId;
      const isUuid = typeof projectId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId);

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert('Permission Required', 'Push notifications need permission to work.');
        return;
      }

      const tokenData = isUuid
        ? await Notifications.getExpoPushTokenAsync({ projectId })
        : await Notifications.getExpoPushTokenAsync();
      setExpoPushToken(tokenData.data);

      // Register token with backend
      try {
        await notificationService.registerPushToken(tokenData.data);
      } catch (err) {
        console.log('Could not register push token with backend:', err.message);
      }

      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#4F46E5',
        });
      }
    } catch (error) {
      // Common case in Expo Go when projectId is missing/invalid or notifications are limited.
      console.error('Error registering push notifications:', error?.message || error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        expoPushToken,
        notifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context)
    throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};

export default NotificationContext;
