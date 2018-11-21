import * as React from "react";

interface ProgressBarProps {
  seconds: number;
}

interface ProgressBarState {
  seconds: number;
}

export default class ProgressBar extends React.Component<ProgressBarProps, ProgressBarState> {
  constructor(props: ProgressBarProps) {
    super(props);
    this._progress = this._progress.bind(this);
    this.state = {
      seconds: 0,
    };
    this._progress();
  }
  _progress() {
    this.setState((p) => {
      return {seconds: (p.seconds + 1) % this.props.seconds};
    });
    setTimeout(this._progress, 500);
  }
  render() {
    return <div className="progress-bar">
      <div className="progress-bar-bar" style={{width: `${Math.round(this.state.seconds * 100 / this.props.seconds)}%`}}>
      </div>
    </div>;
  }
}