import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ReactElement } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorBoundary } from "@shared/components/ErrorBoundary/ErrorBoundary";
import { t } from "@shared/i18n/useTranslation";

const Boom = ({ message }: { message?: string }): never => {
  throw new Error(message ?? "boom");
};

describe("ErrorBoundary", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders children when there is no error", () => {
    render(
      <ErrorBoundary>
        <div>safe content</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText("safe content")).toBeInTheDocument();
  });

  it("renders the default fallback with the error message", () => {
    render(
      <ErrorBoundary>
        <Boom message="explosion" />
      </ErrorBoundary>,
    );
    expect(screen.getByText(t("common.errors.somethingWentWrong"))).toBeInTheDocument();
    expect(screen.getByText("explosion")).toBeInTheDocument();
  });

  it("recovers when the retry button is pressed", () => {
    let shouldThrow = true;
    const Conditional = (): ReactElement => {
      if (shouldThrow) throw new Error("nope");
      return <div>recovered</div>;
    };
    render(
      <ErrorBoundary>
        <Conditional />
      </ErrorBoundary>,
    );
    shouldThrow = false;
    fireEvent.click(screen.getByText(t("common.actions.retry")));
    expect(screen.getByText("recovered")).toBeInTheDocument();
  });

  it("renders a custom fallback and passes a reset callback", () => {
    const fallback = vi.fn((error: Error | null, reset: () => void) => (
      <button onClick={reset}>custom {error?.message}</button>
    ));
    render(
      <ErrorBoundary fallback={fallback}>
        <Boom message="bad" />
      </ErrorBoundary>,
    );
    expect(screen.getByText("custom bad")).toBeInTheDocument();
    expect(fallback).toHaveBeenCalled();
  });
});
