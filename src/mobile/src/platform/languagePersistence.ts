import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";

const LANGUAGE_KEY = "foodize-language";
const cache = new Map<string, string>();

interface SyncWebStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

const syncStorage: SyncWebStorage = {
  getItem: (key) => cache.get(key) ?? null,
  setItem: (key, value) => {
    cache.set(key, value);
    void AsyncStorage.setItem(key, value);
  },
  removeItem: (key) => {
    cache.delete(key);
    void AsyncStorage.removeItem(key);
  },
};

interface GlobalWithShims {
  localStorage?: SyncWebStorage;
  navigator?: { language?: string; languages?: readonly string[] };
}

let warmed: string | null = null;

void AsyncStorage.getItem(LANGUAGE_KEY).then((value) => {
  if (value !== null) {
    warmed = value;
    cache.set(LANGUAGE_KEY, value);
  }
});

const deviceLanguage = getLocales()[0]?.languageCode ?? "ru";

const target = globalThis as GlobalWithShims;
target.localStorage = syncStorage;
target.navigator = {
  ...(target.navigator ?? {}),
  language: deviceLanguage,
  languages: [deviceLanguage],
};

export async function rehydrateLanguage(): Promise<string | null> {
  if (warmed !== null) return warmed;
  const value = await AsyncStorage.getItem(LANGUAGE_KEY);
  if (value !== null) {
    warmed = value;
    cache.set(LANGUAGE_KEY, value);
  }
  return warmed;
}
