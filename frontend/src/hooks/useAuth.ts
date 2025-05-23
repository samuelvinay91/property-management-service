import { useCallback } from 'react';
import { useAuthStore } from '@/store/auth';
import { useMutation } from '@apollo/client';
import { LOGIN_MUTATION, REGISTER_MUTATION, LOGOUT_MUTATION } from '@/lib/graphql/mutations';

interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: string;
}

export const useAuth = () => {
  const { user, isAuthenticated, setUser, clearUser } = useAuthStore();
  
  const [loginMutation] = useMutation(LOGIN_MUTATION);
  const [registerMutation] = useMutation(REGISTER_MUTATION);
  const [logoutMutation] = useMutation(LOGOUT_MUTATION);

  const login = useCallback(async (email: string, password: string, rememberMe?: boolean) => {
    try {
      const { data } = await loginMutation({
        variables: { email, password, rememberMe },
      });
      
      if (data?.login?.user && data?.login?.accessToken) {
        setUser(data.login.user);
        localStorage.setItem('accessToken', data.login.accessToken);
        if (data.login.refreshToken) {
          localStorage.setItem('refreshToken', data.login.refreshToken);
        }
        return data.login.user;
      }
      
      throw new Error('Invalid login response');
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  }, [loginMutation, setUser]);

  const register = useCallback(async (userData: RegisterData) => {
    try {
      const { data } = await registerMutation({
        variables: { input: userData },
      });
      
      if (data?.register?.user) {
        return data.register.user;
      }
      
      throw new Error('Invalid registration response');
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    }
  }, [registerMutation]);

  const logout = useCallback(async () => {
    try {
      await logoutMutation();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearUser();
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }, [logoutMutation, clearUser]);

  const refreshToken = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      // TODO: Implement refresh token mutation
      // const { data } = await refreshTokenMutation({ variables: { refreshToken } });
      // return data.refreshToken;
    } catch (error) {
      clearUser();
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      throw error;
    }
  }, [clearUser]);

  return {
    user,
    isAuthenticated,
    login,
    register,
    logout,
    refreshToken,
  };
};