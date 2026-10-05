import { Component } from "react";
import type { ReactNode } from "react";

// Catches a render crash inside one card; the rest of the list keeps working.
export class CardBoundary extends Component<{ children: ReactNode }, { crashed: boolean }> {
  state = { crashed: false };
  static getDerivedStateFromError() {
    return { crashed: true };
  }
  render() {
    return this.state.crashed ? <span role="alert">%%coverFailed%%</span> : this.props.children;
  }
}
