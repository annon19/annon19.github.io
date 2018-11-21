import * as React from "react";
import { diel } from "../diel/setup";

import BarChart from "./Charts/BarChart";


interface StripUnitProps {
  chronRank: number;
}

interface StripUnitState {
  title: string;
  itxId: number;
  isFocus: boolean;
}

export default class StripUnit extends React.Component<StripUnitProps, StripUnitState> {

  constructor(props: StripUnitProps) {
    super(props);
    this.state = {
      title: null,
      itxId: null,
      isFocus: null,
    };
    this.setTitle = this.setTitle.bind(this);
    // this.setLoading = this.setLoading.bind(this);
    const config = {
      parameters: {
        $chronRank: props.chronRank
      },
      singleRow: true
    };
    diel.BindOutput("chronChartTitle", this.setTitle, config);
    // diel.BindOutput("chronLoadingStatus", this.setLoading, config);
  }

  setTitle(data: {title: string, itxId: number, isFocus: number}) {
    this.setState({
      title: data.title,
      itxId: data.itxId,
      isFocus: data.isFocus === 1
    });
  }

  // setLoading(data: {loaded: number}) {
  //   this.setState({isLoading: data.loaded === 0});
  // }

  render() {
    const clipped = false;
    const { chronRank } = this.props;
    let delays =
    <BarChart
      clipped={clipped}
      chart={"chronDelays"}
      isChron={true}
      chronRank={chronRank}
      xLabel={"delay"}
      yLabel={"count"}
      key={"delays"}
      isCategorical={true}
    />;
    let state = <BarChart
      isChron={true}
      chronRank={chronRank}
      clipped={clipped}
      xLabel={"chronState"}
      yLabel={"count"}
      chart={"chronState"}
      isCategorical={true}
    />;
    let carrier = <BarChart
      isChron={true}
      chronRank={chronRank}
      clipped={clipped}
      xLabel={"carrier"}
      yLabel={"count"}
      chart={"chronCarrier"}
      isCategorical={true}
    />;
    let day = <BarChart
      isChron={true}
      chronRank={chronRank}
      clipped={clipped}
      xLabel={"day"}
      yLabel={"count"}
      chart={"chronDay"}
      isCategorical={false}
    />;

    let labels;
    if (this.state.title) {
      const l = this.state.title.split("&");
      const lDiv = ["state", "day", "carrier", "delays"].map(c => {
        const v = l.filter(v => v.startsWith(c));
        const v2 = v.length > 0 ? v[0].substring(c.length + 1) : "";
        return <tr>
          <td className="label-chart">{c}</td>
          <td className="label-value">{v2}</td>
          </tr>;
      });
      labels = <table>
       {lDiv}
     </table>;
    }
    // ? this.state.title : "none"
    return <div className="chron">
      <div className={`chronInner ${this.state.isFocus ? "chronSelected" : ""}`}
        onClick={() => diel.Input.navigateItx({$xFilterItxId: this.state.itxId})}
      >
        {state}
        {day}
        {carrier}
        {delays}
      </div>
      {labels}
    </div>;

  }
}


