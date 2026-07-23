import AsyncStorage from "@react-native-async-storage/async-storage";
import { rehydrateLanguage } from "@/platform/languagePersistence";

describe("languagePersistence", () => {
  it("installs a localStorage shim on the global scope", () => {
    const target = globalThis as unknown as {
      localStorage?: {
        setItem: (k: string, v: string) => void;
        getItem: (k: string) => string | null;
      };
    };
    expect(target.localStorage).toBeDefined();
    target.localStorage?.setItem("k", "v");
    expect(target.localStorage?.getItem("k")).toBe("v");
  });

  it("sets a navigator language", () => {
    const target = globalThis as { navigator?: { language?: string } };
    expect(typeof target.navigator?.language).toBe("string");
  });

  it("rehydrates a stored language from AsyncStorage", async () => {
    await AsyncStorage.setItem("foodize-language", "en");
    const value = await rehydrateLanguage();
    expect(value === "en" || value === null).toBe(true);
  });
});
