import React from 'react';
import { StyleSheet, ViewStyle, Alert } from 'react-native';
import { Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';

interface BiometricButtonProps {
  onPress: () => void;
  loading?: boolean;
  style?: ViewStyle;
}

export const BiometricButton: React.FC<BiometricButtonProps> = ({
  onPress,
  loading = false,
  style,
}) => {
  const [biometricType, setBiometricType] = React.useState<string>('fingerprint');

  React.useEffect(() => {
    checkBiometricType();
  }, []);

  const checkBiometricType = async () => {
    try {
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType('face-id');
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType('fingerprint');
      } else {
        setBiometricType('lock-closed');
      }
    } catch (error) {
      console.error('Error checking biometric type:', error);
    }
  };

  const getIconName = () => {
    switch (biometricType) {
      case 'face-id':
        return 'scan';
      case 'fingerprint':
        return 'finger-print';
      default:
        return 'lock-closed';
    }
  };

  const getButtonText = () => {
    switch (biometricType) {
      case 'face-id':
        return 'Sign in with Face ID';
      case 'fingerprint':
        return 'Sign in with Fingerprint';
      default:
        return 'Sign in with Biometrics';
    }
  };

  return (
    <Button
      mode="outlined"
      onPress={onPress}
      loading={loading}
      disabled={loading}
      style={[styles.button, style]}
      contentStyle={styles.buttonContent}
      icon={({ size, color }) => (
        <Ionicons name={getIconName() as any} size={size} color={color} />
      )}
    >
      {getButtonText()}
    </Button>
  );
};

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  buttonContent: {
    paddingVertical: 8,
  },
});