import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../config';

import AdminDashboard from '../screens/admin/DashboardScreen';
import TutorApprovalScreen from '../screens/admin/TutorApprovalScreen';
import ClassManagementScreen from '../screens/admin/ClassManagementScreen';
import AddEditClassScreen from '../screens/admin/AddEditClassScreen';
import AnalyticsScreen from '../screens/admin/AnalyticsScreen';
import SendNotificationScreen from '../screens/admin/SendNotificationScreen';
import UserManagementScreen from '../screens/admin/UserManagementScreen';
import ClassRequestsScreen from '../screens/admin/ClassRequestsScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';

const Tab = createBottomTabNavigator();
const AdminStack = createNativeStackNavigator();

const AdminStackNavigator = () => (
  <AdminStack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: COLORS.primary },
      headerTintColor: COLORS.white,
      headerTitleStyle: { fontWeight: '700' },
    }}
  >
    <AdminStack.Screen name="AdminDashboard" component={AdminDashboard} options={{ title: 'Admin Dashboard' }} />
    <AdminStack.Screen name="TutorApprovals" component={TutorApprovalScreen} options={{ title: 'Tutor Approvals' }} />
    <AdminStack.Screen name="UserManagement" component={UserManagementScreen} options={{ title: 'Manage Users' }} />
    <AdminStack.Screen name="ClassManagement" component={ClassManagementScreen} options={{ title: 'Manage Classes' }} />
    <AdminStack.Screen name="AdminAddEditClass" component={AddEditClassScreen} options={{ title: 'Class' }} />
    <AdminStack.Screen name="ClassRequests" component={ClassRequestsScreen} options={{ title: 'Class Requests' }} />
    <AdminStack.Screen name="SendNotification" component={SendNotificationScreen} options={{ title: 'Send Notification' }} />
  </AdminStack.Navigator>
);

const AdminNavigator = () => (
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
        if (route.name === 'AdminTab') iconName = 'shield-outline';
        else if (route.name === 'Analytics') iconName = 'bar-chart-outline';
        else if (route.name === 'Profile') iconName = 'person-outline';
        return <Ionicons name={iconName} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen name="AdminTab" component={AdminStackNavigator} options={{ title: 'Dashboard' }} />
    <Tab.Screen
      name="Analytics"
      component={AnalyticsScreen}
      options={{
        title: 'Analytics',
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

export default AdminNavigator;
