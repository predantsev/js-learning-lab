import { Component } from "react";
import ModuleLoadFallback from "./ModuleLoadFallback";

// Catches errors thrown while rendering its children — a lazy module that failed to load included —
// and renders ModuleLoadFallback in their place.
export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error !== null) {
      return <ModuleLoadFallback error={this.state.error} onReload={this.props.onReload} />;
    }
    return this.props.children;
  }
}
