import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../config';

import StudentHomeScreen from '../screens/student/HomeScreen';
import ClassDetailScreen from '../screens/student/ClassDetailScreen';
import EnrollmentConfirmScreen from '../screens/student/EnrollmentConfirmScreen';
import ReviewScreen from '../screens/student/ReviewScreen';
import NotificationsScreen from '../screens/student/NotificationsScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();

const HomeStackNavigator = () => (
  <HomeStack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: COLORS.primary },
      headerTintColor: COLORS.white,
      headerTitleStyle: { fontWeight: '700' },
    }}
  >
    <HomeStack.Screen name="Home" component={StudentHomeScreen} options={{ title: 'Find Classes' }} />
    <HomeStack.Screen name="ClassDetail" component={ClassDetailScreen} options={{ title: 'Class Details' }} />
    <HomeStack.Screen name="EnrollmentConfirm" component={EnrollmentConfirmScreen} options={{ title: 'Enrollment' }} />
    <HomeStack.Screen name="Review" component={ReviewScreen} options={{ title: 'Write Review' }} />
  </HomeStack.Navigator>
);

const StudentNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.gray,
      tabBarStyle: {
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.grayLight,
        paddingBottom: 5,
        paddingTop: 5,
        height: 60,
      },
      tabBarIcon: ({ color, size }) => {
        let iconName;
        if (route.name === 'HomeTab') iconName = 'search';
        else if (route.name === 'Notifications') iconName = 'notifications-outline';
        else if (route.name === 'Profile') iconName = 'person-outline';
        return <Ionicons name={iconName} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen name="HomeTab" component={HomeStackNavigator} options={{ title: 'Search' }} />
    <Tab.Screen
      name="Notifications"
      component={NotificationsScreen}
      options={{
        title: 'Notifications',
        headerShown: true,
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: COLORS.white,
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        title: 'Profile',
        headerShown: true,
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: COLORS.white,
      }}
    />
  </Tab.Navigator>
);

export default StudentNavigator;
