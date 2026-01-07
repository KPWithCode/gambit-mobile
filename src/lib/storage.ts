import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'gambit_auth_token';
const REFRESH_TOKEN_KEY = 'gambit_refresh_token';

export const saveToken = async (token: string) => {
  await AsyncStorage.setItem(TOKEN_KEY, token);
};

export const getToken = async () => {
  return await AsyncStorage.getItem(TOKEN_KEY);
};

export const saveRefreshToken = async (token: string) => {
  await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
};

export const getRefreshToken = async () => {
  return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
};

export const clearTokens = async () => {
  await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY]);
};