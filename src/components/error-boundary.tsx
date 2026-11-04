import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { hasError: boolean }

// Shows a friendly message instead of a blank page if something crashes.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="crash">
        <h1>Something went wrong</h1>
        <p>Your data never left this browser. Reload the page to start again.</p>
        <button type="button" className="primary" onClick={() => window.location.reload()}>Reload</button>
      </div>
    );
  }
}
