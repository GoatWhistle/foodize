import { render, screen } from "@testing-library/react-native";
import { AppText } from "@/components/AppText";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { captureError } from "@/services/observability";

jest.mock("@/services/observability", () => ({
  captureError: jest.fn(),
}));

function Boom(): React.JSX.Element {
  throw new Error("kaboom");
}

describe("ErrorBoundary", () => {
  it("renders children when there is no error", () => {
    render(
      <ErrorBoundary>
        <AppText>Всё хорошо</AppText>
      </ErrorBoundary>,
    );
    expect(screen.getByText("Всё хорошо")).toBeTruthy();
  });

  it("renders the default fallback and reports the error", () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Что-то пошло не так")).toBeTruthy();
    expect(captureError).toHaveBeenCalled();
  });

  it("renders a custom fallback", () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    render(
      <ErrorBoundary fallback={<AppText>Свой фолбэк</AppText>}>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Свой фолбэк")).toBeTruthy();
  });
});
