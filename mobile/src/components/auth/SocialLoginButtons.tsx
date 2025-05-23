import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

export const SocialLoginButtons: React.FC = () => {
  const handleGoogleLogin = async () => {
    try {
      // TODO: Implement Google OAuth
      Alert.alert('Google Login', 'Google login coming soon!');
    } catch (error) {
      Alert.alert('Error', 'Failed to sign in with Google');
    }
  };

  const handleAppleLogin = async () => {
    try {
      // TODO: Implement Apple Sign In
      Alert.alert('Apple Login', 'Apple Sign In coming soon!');
    } catch (error) {
      Alert.alert('Error', 'Failed to sign in with Apple');
    }
  };

  return (
    <View style={styles.container}>
      <Button
        mode="outlined"
        onPress={handleGoogleLogin}
        style={styles.button}
        contentStyle={styles.buttonContent}
        icon={({ size, color }) => (
          <Ionicons name="logo-google" size={size} color={color} />
        )}
      >
        Continue with Google
      </Button>
      
      <Button
        mode="outlined"
        onPress={handleAppleLogin}
        style={styles.button}
        contentStyle={styles.buttonContent}
        icon={({ size, color }) => (
          <Ionicons name="logo-apple" size={size} color={color} />
        )}
      >
        Continue with Apple
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  button: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  buttonContent: {
    paddingVertical: 8,
  },
});