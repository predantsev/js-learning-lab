import { Component } from "react";
import type { ReactNode } from "react";

// The route's error boundary: it catches errors thrown while its children render.
export class HabitBoundary extends Component<{ children: ReactNode }, { crashed: boolean }> {
  state = { crashed: false };
  static getDerivedStateFromError() {
    return { crashed: true };
  }
  render() {
    if (this.state.crashed) return <p role="alert">%%crashed%%</p>;
    return this.props.children;
  }
}
