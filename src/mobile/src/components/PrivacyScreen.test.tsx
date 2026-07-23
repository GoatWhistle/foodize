import { AppState } from "react-native";
import type { AppStateStatus } from "react-native";
import { act, render, screen } from "@testing-library/react-native";
import { AppText } from "@/components/AppText";
import { PrivacyScreen } from "@/components/PrivacyScreen";

type Listener = (state: AppStateStatus) => void;

describe("PrivacyScreen", () => {
  let listener: Listener | null = null;
  const remove = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    listener = null;
    (AppState as unknown as { currentState: AppStateStatus }).currentState = "active";
    jest.spyOn(AppState, "addEventListener").mockImplementation((_event, cb) => {
      listener = cb;
      return { remove };
    });
  });

  const emit = (state: AppStateStatus): void => {
    act(() => {
      listener?.(state);
    });
  };

  it("renders children and no overlay while active", () => {
    render(
      <PrivacyScreen>
        <AppText>content</AppText>
      </PrivacyScreen>,
    );
    expect(screen.getByText("content")).toBeTruthy();
    expect(screen.queryByTestId("privacy-overlay")).toBeNull();
  });

  it("shows the overlay when backgrounded and hides it when active again", () => {
    render(
      <PrivacyScreen>
        <AppText>content</AppText>
      </PrivacyScreen>,
    );
    emit("background");
    expect(screen.getByTestId("privacy-overlay")).toBeTruthy();
    emit("active");
    expect(screen.queryByTestId("privacy-overlay")).toBeNull();
  });

  it("shows the overlay when inactive", () => {
    render(
      <PrivacyScreen>
        <AppText>content</AppText>
      </PrivacyScreen>,
    );
    emit("inactive");
    expect(screen.getByTestId("privacy-overlay")).toBeTruthy();
  });

  it("starts obscured when the initial state is backgrounded", () => {
    (AppState as unknown as { currentState: AppStateStatus }).currentState = "background";
    render(
      <PrivacyScreen>
        <AppText>content</AppText>
      </PrivacyScreen>,
    );
    expect(screen.getByTestId("privacy-overlay")).toBeTruthy();
  });

  it("removes the listener on unmount", () => {
    const view = render(
      <PrivacyScreen>
        <AppText>content</AppText>
      </PrivacyScreen>,
    );
    view.unmount();
    expect(remove).toHaveBeenCalled();
  });
});
