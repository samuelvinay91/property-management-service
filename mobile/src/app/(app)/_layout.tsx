import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function AppLayout() {
  const { user, isLoading } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Redirect to login if user is not authenticated
  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack>
      <Stack.Screen 
        name="(tabs)" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen
        name="property/[id]"
        options={{
          title: 'Property Details',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="maintenance/[id]"
        options={{
          title: 'Maintenance Request',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="booking/[id]"
        options={{
          title: 'Booking Details',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="tenant/[id]"
        options={{
          title: 'Tenant Profile',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="camera"
        options={{
          title: 'Camera',
          headerShown: false,
          presentation: 'fullScreenModal',
        }}
      />
      <Stack.Screen
        name="document-viewer"
        options={{
          title: 'Document Viewer',
          headerShown: true,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: true,
        }}
      />
    </Stack>
  );
}