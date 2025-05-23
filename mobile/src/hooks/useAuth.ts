import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthResult {
  success: boolean;
  error?: string;
  user?: User;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const userData = await AsyncStorage.getItem('userData');
      
      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    try {
      setIsLoading(true);
      
      // TODO: Replace with actual API call
      const mockUser: User = {
        id: '1',
        email,
        firstName: 'John',
        lastName: 'Doe',
        role: 'TENANT',
      };

      // Store auth data
      await AsyncStorage.setItem('accessToken', 'mock-token');
      await AsyncStorage.setItem('userData', JSON.stringify(mockUser));
      
      // Store credentials for biometric login
      await SecureStore.setItemAsync('biometric_email', email);
      await SecureStore.setItemAsync('biometric_password', password);

      setUser(mockUser);
      setIsAuthenticated(true);

      return { success: true, user: mockUser };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithBiometrics = async (): Promise<AuthResult> => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        return { success: false, error: 'Biometric authentication not available' };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to sign in',
        fallbackLabel: 'Use password',
        disableDeviceFallback: false,
      });

      if (result.success) {
        // Retrieve stored credentials
        const email = await SecureStore.getItemAsync('biometric_email');
        const password = await SecureStore.getItemAsync('biometric_password');

        if (email && password) {
          return await signIn(email, password);
        } else {
          return { success: false, error: 'No stored credentials found' };
        }
      } else {
        return { success: false, error: 'Authentication failed' };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('userData');
      
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: string
  ): Promise<AuthResult> => {
    try {
      setIsLoading(true);
      
      // TODO: Replace with actual API call
      const mockUser: User = {
        id: '1',
        email,
        firstName,
        lastName,
        role,
      };

      // Auto sign in after successful registration
      await AsyncStorage.setItem('accessToken', 'mock-token');
      await AsyncStorage.setItem('userData', JSON.stringify(mockUser));

      setUser(mockUser);
      setIsAuthenticated(true);

      return { success: true, user: mockUser };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    signIn,
    signInWithBiometrics,
    signOut,
    signUp,
  };
};