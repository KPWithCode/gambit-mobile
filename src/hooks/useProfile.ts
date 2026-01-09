// src/hooks/useProfile.ts
import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

export interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  gems: number;
  wins: number;
  losses: number;
  avatar_url?: string;
}

export const useProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await api.get('/users/me');
      setProfile(response.data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, refreshProfile: fetchProfile };
};