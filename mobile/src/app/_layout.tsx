import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider as ReduxProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import { ApolloProvider } from '@apollo/client';
import { apolloClient } from '@/lib/apollo';
import { store, persistor } from '@/store';
import { AuthProvider } from '@/providers/AuthProvider';
import { NotificationProvider } from '@/providers/NotificationProvider';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { theme } from '@/theme';

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'Inter-Regular': require('../../assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('../../assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('../../assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('../../assets/fonts/Inter-Bold.ttf'),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ReduxProvider store={store}>
            <PersistGate loading={<LoadingSpinner />} persistor={persistor}>
              <ApolloProvider client={apolloClient}>
                <PaperProvider theme={theme}>
                  <AuthProvider>
                    <NotificationProvider>
                      <StatusBar style="auto" />
                      <Stack>
                        <Stack.Screen 
                          name="(auth)" 
                          options={{ headerShown: false }} 
                        />
                        <Stack.Screen 
                          name="(app)" 
                          options={{ headerShown: false }} 
                        />
                        <Stack.Screen
                          name="modal"
                          options={{ 
                            presentation: 'modal',
                            headerShown: false
                          }}
                        />
                      </Stack>
                    </NotificationProvider>
                  </AuthProvider>
                </PaperProvider>
              </ApolloProvider>
            </PersistGate>
          </ReduxProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}