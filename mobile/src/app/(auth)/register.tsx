import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Link, router } from 'expo-router';
import { Button, TextInput, SegmentedButtons } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/hooks/useAuth';
import { Container } from '@/components/ui/Container';
import { SafeArea } from '@/components/ui/SafeArea';
import { Logo } from '@/components/ui/Logo';
import { theme } from '@/theme';

interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: string;
}

export default function RegisterScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { signUp } = useAuth();
  
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    defaultValues: {
      role: 'TENANT',
    },
  });

  const password = watch('password');

  const onSubmit = async (data: RegisterForm) => {
    if (data.password !== data.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      const result = await signUp(
        data.email,
        data.password,
        data.firstName,
        data.lastName,
        data.role
      );
      
      if (result.success) {
        router.replace('/(app)/(tabs)');
      } else {
        Alert.alert('Registration Failed', result.error || 'Please try again.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeArea>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Container style={styles.content}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Logo size="large" />
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join PropFlow today</Text>
            </View>

            {/* Registration Form */}
            <View style={styles.form}>
              {/* Name Fields */}
              <View style={styles.nameContainer}>
                <View style={styles.nameField}>
                  <Controller
                    control={control}
                    rules={{
                      required: 'First name is required',
                      minLength: { value: 2, message: 'Must be at least 2 characters' },
                    }}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        label="First Name"
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        error={!!errors.firstName}
                        autoCapitalize="words"
                        autoComplete="given-name"
                        textContentType="givenName"
                        style={styles.input}
                      />
                    )}
                    name="firstName"
                  />
                  {errors.firstName && (
                    <Text style={styles.errorText}>{errors.firstName.message}</Text>
                  )}
                </View>

                <View style={styles.nameField}>
                  <Controller
                    control={control}
                    rules={{
                      required: 'Last name is required',
                      minLength: { value: 2, message: 'Must be at least 2 characters' },
                    }}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        label="Last Name"
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        error={!!errors.lastName}
                        autoCapitalize="words"
                        autoComplete="family-name"
                        textContentType="familyName"
                        style={styles.input}
                      />
                    )}
                    name="lastName"
                  />
                  {errors.lastName && (
                    <Text style={styles.errorText}>{errors.lastName.message}</Text>
                  )}
                </View>
              </View>

              {/* Email */}
              <Controller
                control={control}
                rules={{
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Email"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    error={!!errors.email}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    textContentType="emailAddress"
                    left={<TextInput.Icon icon="email" />}
                    style={styles.input}
                  />
                )}
                name="email"
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email.message}</Text>
              )}

              {/* Phone */}
              <Controller
                control={control}
                rules={{
                  required: 'Phone number is required',
                  pattern: {
                    value: /^[\+]?[\d\s\-\(\)]{10,}$/,
                    message: 'Invalid phone number',
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Phone Number"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    error={!!errors.phone}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    textContentType="telephoneNumber"
                    left={<TextInput.Icon icon="phone" />}
                    style={styles.input}
                  />
                )}
                name="phone"
              />
              {errors.phone && (
                <Text style={styles.errorText}>{errors.phone.message}</Text>
              )}

              {/* Role Selection */}
              <View style={styles.roleContainer}>
                <Text style={styles.roleLabel}>Account Type</Text>
                <Controller
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <SegmentedButtons
                      value={value}
                      onValueChange={onChange}
                      buttons={[
                        { value: 'TENANT', label: 'Tenant' },
                        { value: 'PROPERTY_OWNER', label: 'Owner' },
                        { value: 'PROPERTY_MANAGER', label: 'Manager' },
                      ]}
                      style={styles.segmentedButtons}
                    />
                  )}
                  name="role"
                />
              </View>

              {/* Password */}
              <Controller
                control={control}
                rules={{
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Password must be at least 8 characters' },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    message: 'Password must contain uppercase, lowercase, and number',
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Password"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    error={!!errors.password}
                    secureTextEntry={!showPassword}
                    autoComplete="password-new"
                    textContentType="newPassword"
                    left={<TextInput.Icon icon="lock" />}
                    right={
                      <TextInput.Icon
                        icon={showPassword ? 'eye-off' : 'eye'}
                        onPress={() => setShowPassword(!showPassword)}
                      />
                    }
                    style={styles.input}
                  />
                )}
                name="password"
              />
              {errors.password && (
                <Text style={styles.errorText}>{errors.password.message}</Text>
              )}

              {/* Confirm Password */}
              <Controller
                control={control}
                rules={{
                  required: 'Please confirm your password',
                  validate: value => value === password || 'Passwords do not match',
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Confirm Password"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    error={!!errors.confirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoComplete="password-new"
                    textContentType="newPassword"
                    left={<TextInput.Icon icon="lock-check" />}
                    right={
                      <TextInput.Icon
                        icon={showConfirmPassword ? 'eye-off' : 'eye'}
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      />
                    }
                    style={styles.input}
                  />
                )}
                name="confirmPassword"
              />
              {errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>
              )}

              {/* Register Button */}
              <Button
                mode="contained"
                onPress={handleSubmit(onSubmit)}
                loading={isLoading}
                disabled={isLoading}
                style={styles.registerButton}
                contentStyle={styles.buttonContent}
              >
                Create Account
              </Button>

              {/* Terms */}
              <Text style={styles.termsText}>
                By creating an account, you agree to our{' '}
                <Text style={styles.linkText}>Terms of Service</Text> and{' '}
                <Text style={styles.linkText}>Privacy Policy</Text>
              </Text>

              {/* Sign In Link */}
              <View style={styles.signinContainer}>
                <Text style={styles.signinText}>Already have an account? </Text>
                <Link href="/(auth)/login" asChild>
                  <Button mode="text" compact>
                    Sign In
                  </Button>
                </Link>
              </View>
            </View>
          </Container>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.onBackground,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  nameContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  nameField: {
    flex: 1,
  },
  roleContainer: {
    gap: 8,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.onBackground,
  },
  segmentedButtons: {
    backgroundColor: theme.colors.surface,
  },
  input: {
    backgroundColor: theme.colors.surface,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    marginTop: -12,
    marginLeft: 16,
  },
  registerButton: {
    marginTop: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  termsText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 16,
  },
  linkText: {
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  },
  signinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  signinText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 16,
  },
});