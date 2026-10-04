import { Component } from "react";

// An error boundary around the total: it reports whatever reaches it.
export default class Boundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error) {
    console.log(`%%boundaryCaught%%: ${error.message}`);
  }
  render() {
    return this.state.failed ? <p>%%fallback%%</p> : this.props.children;
  }
}
