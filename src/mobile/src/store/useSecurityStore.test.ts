import { useSecurityStore } from "@/store/useSecurityStore";

describe("useSecurityStore", () => {
  beforeEach(() => {
    useSecurityStore.setState({ biometricEnabled: false, unlocked: false });
  });

  it("defaults to disabled and locked", () => {
    const state = useSecurityStore.getState();
    expect(state.biometricEnabled).toBe(false);
    expect(state.unlocked).toBe(false);
  });

  it("toggles the biometric flag", () => {
    useSecurityStore.getState().setBiometricEnabled(true);
    expect(useSecurityStore.getState().biometricEnabled).toBe(true);
    useSecurityStore.getState().setBiometricEnabled(false);
    expect(useSecurityStore.getState().biometricEnabled).toBe(false);
  });

  it("updates the unlocked flag", () => {
    useSecurityStore.getState().setUnlocked(true);
    expect(useSecurityStore.getState().unlocked).toBe(true);
  });
});
