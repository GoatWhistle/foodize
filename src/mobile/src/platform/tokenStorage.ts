import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "foodize.accessToken";
const REFRESH_TOKEN_KEY = "foodize.refreshToken";

let cachedAccessToken: string | null = null;

export const tokenStorage = {
  getAccessToken(): string | null {
    return cachedAccessToken;
  },

  async loadAccessToken(): Promise<string | null> {
    cachedAccessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    return cachedAccessToken;
  },

  async setAccessToken(token: string): Promise<void> {
    cachedAccessToken = token;
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
  },

  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },

  async setRefreshToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  },

  async clear(): Promise<void> {
    cachedAccessToken = null;
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  },
};
