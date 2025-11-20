import { MD3LightTheme as DefaultLight, MD3DarkTheme as DefaultDark } from 'react-native-paper';

export const DarkTheme = {
  ...DefaultDark,
  colors: {
    ...DefaultDark.colors,
    primary: '#037DD6',
    background: '#121416',
    surface: '#1C1F22',
    elevation: { level2: '#24272A' },
    text: '#FFFFFF',
    secondary: '#8B92A6',
    warning: '#F7931A',
    success: '#4CAF50',
    error: '#D32F2F',
  },
};

export const LightTheme = {
  ...DefaultLight,
  colors: {
    ...DefaultLight.colors,
    primary: '#037DD6',
    background: '#F4F6F8',
    surface: '#FFFFFF',
    elevation: { level2: '#E9ECEF' },
    text: '#1A1D21',
    secondary: '#4F5660',
    warning: '#F7931A',
    success: '#2E7D32',
    error: '#D32F2F',
  },
};
