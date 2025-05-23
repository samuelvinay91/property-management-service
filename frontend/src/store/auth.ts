import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthState, LoginCredentials, RegisterData } from '@/types';
import { apolloClient } from '@/lib/apollo-client';
import { LOGIN, REGISTER, REFRESH_TOKEN, LOGOUT, GET_CURRENT_USER } from '@/lib/graphql/mutations';

interface AuthStore extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials: LoginCredentials) => {
        try {
          set({ isLoading: true });
          
          const { data } = await apolloClient.mutate({
            mutation: LOGIN,
            variables: credentials,
          });

          const { token, user } = data.login;
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });

          // Store token in localStorage
          localStorage.setItem('token', token);
          
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data: RegisterData) => {
        try {
          set({ isLoading: true });
          
          const { data: result } = await apolloClient.mutate({
            mutation: REGISTER,
            variables: { input: data },
          });

          const { token, user } = result.register;
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });

          // Store token in localStorage
          localStorage.setItem('token', token);
          
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          // Call logout mutation to invalidate token on server
          await apolloClient.mutate({
            mutation: LOGOUT,
          });
        } catch (error) {
          // Continue with logout even if server call fails
          console.error('Logout error:', error);
        } finally {
          // Clear state and localStorage
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });

          localStorage.removeItem('token');
          
          // Clear Apollo cache
          await apolloClient.clearStore();
        }
      },

      refreshToken: async () => {
        try {
          const { data } = await apolloClient.mutate({
            mutation: REFRESH_TOKEN,
          });

          const { token, user } = data.refreshToken;
          
          set({
            user,
            token,
            isAuthenticated: true,
          });

          // Store new token in localStorage
          localStorage.setItem('token', token);
          
        } catch (error) {
          // If refresh fails, logout
          await get().logout();
          throw error;
        }
      },

      getCurrentUser: async () => {
        try {
          set({ isLoading: true });
          
          const { data } = await apolloClient.query({
            query: GET_CURRENT_USER,
            fetchPolicy: 'network-only',
          });

          const user = data.me;
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
          
        } catch (error) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
          throw error;
        }
      },

      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user });
      },

      setToken: (token: string | null) => {
        set({ token });
        if (token) {
          localStorage.setItem('token', token);
        } else {
          localStorage.removeItem('token');
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Initialize auth on app start
export const initializeAuth = async () => {
  const token = localStorage.getItem('token');
  
  if (token) {
    useAuthStore.setState({ token });
    
    try {
      await useAuthStore.getState().getCurrentUser();
    } catch (error) {
      // If getting current user fails, clear auth
      await useAuthStore.getState().logout();
    }
  }
};