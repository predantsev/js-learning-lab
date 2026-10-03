import { Component } from "react";
import { Fallback } from "./Fallback";

// Shows <Fallback> when a child throws while rendering; "Try again" clears the error.
export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error !== null) {
      return <Fallback onReset={() => this.setState({ error: null })} />;
    }
    return this.props.children;
  }
}
