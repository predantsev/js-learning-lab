import { Component } from "react";

// Legacy style: a class with a pair of lifecycle methods.
export class ElapsedClass extends Component {
  state = { seconds: 0 };

  componentDidMount() {
    this.intervalId = setInterval(() => {
      console.log("class tick");
      this.setState((state) => ({ seconds: state.seconds + 1 }));
    }, 1000);
  }

  componentWillUnmount() {
    clearInterval(this.intervalId);
  }

  render() {
    return <p>%%classLabel%%: {this.state.seconds} %%sec%%</p>;
  }
}
