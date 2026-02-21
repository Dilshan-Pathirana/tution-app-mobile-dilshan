import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../config';

import AuthNavigator from './AuthNavigator';
import StudentNavigator from './StudentNavigator';
import TutorNavigator from './TutorNavigator';
import AdminNavigator from './AdminNavigator';

const RootStack = createNativeStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const getNavigator = () => {
    if (!isAuthenticated) return <AuthNavigator />;
    switch (user?.role) {
      case 'tutor':
        return <TutorNavigator />;
      case 'admin':
        return <AdminNavigator />;
      default:
        return <StudentNavigator />;
    }
  };

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        ) : user?.role === 'tutor' ? (
          <RootStack.Screen name="TutorMain" component={TutorNavigator} />
        ) : user?.role === 'admin' ? (
          <RootStack.Screen name="AdminMain" component={AdminNavigator} />
        ) : (
          <RootStack.Screen name="StudentMain" component={StudentNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
