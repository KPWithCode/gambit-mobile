import { create } from 'zustand';
import { User } from '../types/api';
import { saveToken, saveRefreshToken, clearTokens, getToken } from '../lib/storage';
import api from '@/lib/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  initAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (accessToken, refreshToken, user) => {
    try {
    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    await saveToken(accessToken);
    if (refreshToken) {
      await saveRefreshToken(refreshToken);
    } else {
      console.log("Note: No refresh token provided by server");
    }
    set({ user, isAuthenticated: true, isLoading: false });
  } catch (err) {
    console.error("Store Login Error:", err);
    throw err; 
  }
},
  logout: async () => {
    await clearTokens();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  updateUser: (user) => {
    set({ user });
  },

  initAuth: async () => {
    const token = await getToken();
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Token exists, user is authenticated
      // We'll fetch user data in the next step
      set({ isAuthenticated: true, isLoading: false });
    } else {
      set({ isAuthenticated: false, isLoading: false });
    }
  },
}));