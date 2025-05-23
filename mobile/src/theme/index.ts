import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#3B82F6',
    primaryContainer: '#EBF4FF',
    secondary: '#10B981',
    secondaryContainer: '#ECFDF5',
    tertiary: '#F59E0B',
    tertiaryContainer: '#FFFBEB',
    error: '#EF4444',
    errorContainer: '#FEF2F2',
    background: '#FFFFFF',
    surface: '#F8FAFC',
    surfaceVariant: '#F1F5F9',
    onBackground: '#1E293B',
    onSurface: '#334155',
    onSurfaceVariant: '#64748B',
    outline: '#CBD5E1',
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#60A5FA',
    primaryContainer: '#1E3A8A',
    secondary: '#34D399',
    secondaryContainer: '#064E3B',
    tertiary: '#FBBF24',
    tertiaryContainer: '#92400E',
    error: '#F87171',
    errorContainer: '#7F1D1D',
    background: '#0F172A',
    surface: '#1E293B',
    surfaceVariant: '#334155',
    onBackground: '#F1F5F9',
    onSurface: '#E2E8F0',
    onSurfaceVariant: '#94A3B8',
    outline: '#475569',
  },
};

export const theme = lightTheme;