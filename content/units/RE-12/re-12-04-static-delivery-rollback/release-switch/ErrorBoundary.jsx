import { Component } from "react";

// Catches errors thrown while rendering its children — a lazy module that failed to load included —
// and shows a fallback.
export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error !== null) {
      return <p role="alert">%%brokenPart%% ({this.state.error.message})</p>;
    }
    return this.props.children;
  }
}
