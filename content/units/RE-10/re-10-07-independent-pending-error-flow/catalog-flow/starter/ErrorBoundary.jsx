import { Component } from "react";

// Shows an alert with a "Try again" button when a child throws while rendering.
// The button calls the onRetry prop; giving the boundary a new key clears its error.
export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error !== null) {
      return (
        <div role="alert">
          <p>%%loadFailed%%</p>
          <button onClick={this.props.onRetry}>%%tryAgain%%</button>
        </div>
      );
    }
    return this.props.children;
  }
}
