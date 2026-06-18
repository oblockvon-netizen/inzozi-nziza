import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorState } from "./ErrorState";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("UI error boundary:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="w-full max-w-md">
            <ErrorState
              title={this.props.fallbackTitle ?? "Unexpected error"}
              message={this.state.error.message || "Please refresh the page and try again."}
              onRetry={() => {
                this.setState({ error: null });
                window.location.reload();
              }}
              retryLabel="Reload page"
            />
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
