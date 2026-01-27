import { useAuthStore } from '../store/authstore';
import api from '../lib/api';
import { AuthResponse, User } from '../types/api';
import { API_URL } from '@/utils/constants';
import { useEffect } from 'react';

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, login, logout, updateUser, initAuth } = useAuthStore();

  useEffect(() => {
    console.log('🔍 User object details:', JSON.stringify(user, null, 2));
    console.log('🔍 User keys:', user ? Object.keys(user) : 'no user');
  }, [user]);
  
  const register = async (email: string, password: string, username: string) => {
    try {
      const response = await api.post<AuthResponse>('/auth/register', {
        email,
        password,
        username,
      });

      await login(
        response.data.accessToken,
        response.data.refreshToken,
        response.data.user
      );

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Registration failed',
      };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting login to:', `${API_URL}/auth/login`); 
      const response = await api.post<AuthResponse>('/auth/login', {
        email,
        password,
      });
      console.log('Login response:', response.data); 

      await login(
        response.data.accessToken,
        response.data.refreshToken,
        response.data.user
      );

      return { success: true };
    } catch (error: any) {
      console.error('Login Error Detail:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed',
      };
    }
  };

  const signOut = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Logout anyway even if API call fails
    } finally {
      await logout();
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    register,
    signIn,
    signOut,
    updateUser,
    initAuth,
  };
};