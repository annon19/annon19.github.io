import * as React from "react";

import BarChart from "./Charts/BarChart";
import { diel } from "../diel/setup";
import { EventType } from "../lib/helper";
import ChronicleFilemStrip from "./ChroniclesFilmStrip";
import { IsChronicles } from "../lib/config";

interface ScrubberViewProps {
  showIntro?: boolean;
  width?: number;
  height?: number;
}

interface ScrubberViewState {
  clipped: boolean;
  control: boolean;
}

export default class ScrubberView extends React.Component<ScrubberViewProps, ScrubberViewState> {

  static defaultProps = {
    width: 800,
    height: 100,
    isTraining: false,
  };

  constructor(props: ScrubberViewProps) {
    super(props);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.toggleClip = this.toggleClip.bind(this);
    this.setControl = this.setControl.bind(this);
    this.state = {
      control: true,
      clipped: true,
    };
    diel.BindFreeze(this.setControl);
  }

  setControl(control: boolean) {
    this.setState({control});
  }

  componentWillMount() {
    if (IsChronicles) document.addEventListener("keydown", this.handleKeyDown);
  }

  componentWillUnmount() {
    if (IsChronicles) document.removeEventListener("keydown", this.handleKeyDown);
  }

  componentDidMount() {
    console.log("React all setup, calling tick");
    diel.tick()();
  }

  handleKeyDown(e: any) {
    // arrow up/down button should select next/previous list element
    if (e.keyCode === 38 || e.keyCode === 37) {
      diel.Input.deltaItx({$val: -1});
    } else if (e.keyCode === 40 || e.keyCode === 39) {
      diel.Input.deltaItx({$val: 1});
    }
  }

  toggleClip() {
    this.setState((prev) => {
      const clipped = !prev.clipped;
      diel.LogData.eventLog({
        $eventName: EventType[EventType.Clip],
        $parameter: clipped
      });
      return {clipped};
    });
  }



render() {
    let { showIntro } = this.props;
    let { clipped, control } = this.state;
    let delays =
        <BarChart
          // ref={v => this.delaysChart = v}
          clipped={clipped}
          showIntro={showIntro}
          chart={"delays"}
          xLabel={"delay"}
          yLabel={"count"}
          key={"delays"}
          isCategorical={true}
        />;
    let state = <BarChart
          // ref={v => this.stateChart = v}
          clipped={clipped}
          xLabel={"state"}
          yLabel={"count"}
          chart={"state"}
          isCategorical={true}
        />;
    let carrier = <BarChart
          // ref={v => this.carrierChart = v}
          clipped={clipped}
          xLabel={"carrier"}
          yLabel={"count"}
          chart={"carrier"}
          isCategorical={true}
        />;
    let day = <BarChart
        // ref={v => this.dayChart = v}
        clipped={clipped}
        xLabel={"day"}
        yLabel={"count"}
        chart={"day"}
        isCategorical={false}
        showIntro={showIntro}
      />;
    const slider = IsChronicles ? <ChronicleFilemStrip
    /> : null;

    // so when the item is not specified, the field is omitted
    return <div className={`vis-portal`}>
      <div style={{float: "left"}}>
        <button
          className="general-btn vis-btn "
          style={{width: 75}}
          onClick={this.toggleClip}
          >{this.state.clipped ? "" : "un"}zoom</button>
        {IsChronicles
          ? <button
            className="general-btn vis-btn"
            onClick={diel.Input.deleteItx}
            >clear history</button>
          : null}
      </div>
      <br style={{clear: "both"}} />
      <div id="all-charts" className={`${control ? "" : "dimmed"}`}>
        <div className="chart-layout-wrapper">
          {state}
        </div>
        <div className="chart-layout-wrapper">
          {day}
        </div>
        <div className="chart-layout-wrapper">
          {carrier}
        </div>
        <div className="chart-layout-wrapper">
          <div style={{overflow: "auto"}}>
            {delays}
          </div>
        </div>
        <div style={{clear: "both"}}></div>
      </div>
      <div className={`${control ? "" : "dimmed"}`}>
        {slider}
        <div style={{clear: "both"}}></div>
      </div>
    </div>;
  }
}