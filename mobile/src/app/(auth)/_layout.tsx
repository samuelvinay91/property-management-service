import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function AuthLayout() {
  const { user, isLoading } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Redirect to app if user is authenticated
  if (user) {
    return <Redirect href="/(app)/(tabs)" />;
  }

  return (
    <Stack>
      <Stack.Screen 
        name="login" 
        options={{
          title: 'Sign In',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="register" 
        options={{
          title: 'Sign Up',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="forgot-password" 
        options={{
          title: 'Reset Password',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="verify-email" 
        options={{
          title: 'Verify Email',
          headerShown: false,
        }} 
      />
    </Stack>
  );
}