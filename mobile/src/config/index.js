import Constants from 'expo-constants';

const ANDROID_EMULATOR_URL = 'http://10.0.2.2:5000/api';

const getDevServerHost = () => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) return hostUri.split(':')[0];

  const debuggerHost = Constants.expoGoConfig?.debuggerHost;
  if (debuggerHost) return debuggerHost.split(':')[0];

  return null;
};

const getDefaultApiBaseUrl = () => {
  const host = getDevServerHost();
  if (host) return `http://${host}:5000/api`;
  return ANDROID_EMULATOR_URL;
};

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || getDefaultApiBaseUrl();

export const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_KEY || 'pk_test_your_stripe_key';

export const COLORS = {
  primary: '#4F46E5',
  primaryDark: '#3730A3',
  primaryLight: '#818CF8',
  secondary: '#F59E0B',
  background: '#F9FAFB',
  white: '#FFFFFF',
  black: '#111827',
  gray: '#6B7280',
  grayLight: '#E5E7EB',
  grayLighter: '#F3F4F6',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  star: '#FBBF24',
};

export const FONTS = {
  regular: 'System',
  bold: 'System',
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};
