import { Component } from "react";
import { Fallback } from "./Fallback";

export class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.warn("ErrorBoundary caught:", error.message);
  }

  reset = () => {
    this.setState({ hasError: false });
  };

  render() {
    return this.state.hasError ? <Fallback onReset={this.reset} /> : this.props.children;
  }
}
