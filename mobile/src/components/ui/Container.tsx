import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';

interface ContainerProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  padding?: 'none' | 'small' | 'medium' | 'large';
  center?: boolean;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  style,
  padding = 'medium',
  center = false,
}) => {
  const containerStyles = [
    styles.container,
    styles[`padding_${padding}`],
    center && styles.center,
    style,
  ].filter(Boolean);

  return <View style={containerStyles}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  padding_none: {
    padding: 0,
  },
  padding_small: {
    padding: 8,
  },
  padding_medium: {
    padding: 16,
  },
  padding_large: {
    padding: 24,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});