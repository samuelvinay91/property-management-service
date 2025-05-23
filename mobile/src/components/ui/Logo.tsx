import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  showText?: boolean;
  color?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'medium',
  style,
  showText = true,
  color = '#3B82F6',
}) => {
  const iconSize = {
    small: 24,
    medium: 40,
    large: 56,
  }[size];

  const textSize = {
    small: 16,
    medium: 24,
    large: 32,
  }[size];

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.iconContainer, { backgroundColor: color }]}>
        <Ionicons
          name="home"
          size={iconSize}
          color="white"
        />
      </View>
      {showText && (
        <Text style={[styles.text, { fontSize: textSize, color }]}>
          PropFlow
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  iconContainer: {
    borderRadius: 12,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: 'bold',
    marginTop: 8,
  },
});