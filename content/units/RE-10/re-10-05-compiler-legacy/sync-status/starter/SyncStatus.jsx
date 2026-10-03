import { Component } from "react";
import { connection } from "./connection";

// TODO: rewrite this legacy class as a function component with the same behavior.
export class SyncStatus extends Component {
  state = { online: connection.online };

  componentDidMount() {
    this.unsubscribe = connection.subscribe((online) => this.setState({ online }));
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  render() {
    return <p role="status">{this.state.online ? "%%synced%%" : "%%offline%%"}</p>;
  }
}
