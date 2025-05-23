import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SafeAreaProps {
  children: React.ReactNode;
  backgroundColor?: string;
  statusBarStyle?: 'default' | 'light-content' | 'dark-content';
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export const SafeArea: React.FC<SafeAreaProps> = ({
  children,
  backgroundColor = '#ffffff',
  statusBarStyle = 'dark-content',
  edges = ['top', 'bottom'],
}) => {
  const insets = useSafeAreaInsets();

  const style = {
    flex: 1,
    backgroundColor,
    paddingTop: edges.includes('top') ? insets.top : 0,
    paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
    paddingLeft: edges.includes('left') ? insets.left : 0,
    paddingRight: edges.includes('right') ? insets.right : 0,
  };

  return (
    <SafeAreaView style={style}>
      <StatusBar
        backgroundColor={backgroundColor}
        barStyle={statusBarStyle}
        translucent={false}
      />
      {children}
    </SafeAreaView>
  );
};