import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../config';

import TutorDashboard from '../screens/tutor/DashboardScreen';
import AddEditClassScreen from '../screens/tutor/AddEditClassScreen';
import AnnouncementsScreen from '../screens/tutor/AnnouncementsScreen';
import PromotionScreen from '../screens/tutor/PromotionScreen';
import EnrollmentsListScreen from '../screens/tutor/EnrollmentsListScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';
import NotificationsScreen from '../screens/student/NotificationsScreen';

const Tab = createBottomTabNavigator();
const DashStack = createNativeStackNavigator();

const DashboardStackNavigator = () => (
  <DashStack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: COLORS.primary },
      headerTintColor: COLORS.white,
      headerTitleStyle: { fontWeight: '700' },
    }}
  >
    <DashStack.Screen name="Dashboard" component={TutorDashboard} options={{ title: 'My Classes' }} />
    <DashStack.Screen name="AddEditClass" component={AddEditClassScreen} options={{ title: 'Class' }} />
    <DashStack.Screen name="Announcements" component={AnnouncementsScreen} options={{ title: 'Announcements' }} />
    <DashStack.Screen name="Promotion" component={PromotionScreen} options={{ title: 'Promote Class' }} />
    <DashStack.Screen name="EnrollmentsList" component={EnrollmentsListScreen} options={{ title: 'Enrolled Students' }} />
  </DashStack.Navigator>
);

const TutorNavigator = () => (
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
        if (route.name === 'DashboardTab') iconName = 'grid-outline';
        else if (route.name === 'Notifications') iconName = 'notifications-outline';
        else if (route.name === 'Profile') iconName = 'person-outline';
        return <Ionicons name={iconName} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen name="DashboardTab" component={DashboardStackNavigator} options={{ title: 'Classes' }} />
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

export default TutorNavigator;
