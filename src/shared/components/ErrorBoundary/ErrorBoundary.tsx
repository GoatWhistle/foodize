import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error | null, reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, () => { this.setState({ hasError: false, error: null }); });
      }
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "40vh",
            gap: 16,
            padding: 24,
            textAlign: "center",
          }}
        >
          <div style={{ fontWeight: 700, fontSize: "var(--text-md)", color: "var(--text-1)" }}>
            Что-то пошло не так
          </div>
          <div style={{ fontSize: "var(--text-base)", color: "var(--text-3)", maxWidth: 320 }}>
            {this.state.error?.message ?? "Неизвестная ошибка"}
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => { this.setState({ hasError: false, error: null }); }}
          >
            Попробовать снова
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
