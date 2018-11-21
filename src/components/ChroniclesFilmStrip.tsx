import * as React from "react";
// import { LayoutInfo } from "../lib/chart/chartHelper";
// import { SvgSpinner } from "./SvgSpinner";
import { diel } from "../diel/setup";
import StripUnit from "./StripUnit";

// type ImagesType = {itxId: number, img: string}[];
interface ChronicleSliderState {
  // get all the images
  // focusItx: number;
  // itxIdsInfo: LoadingSummary;
  // images: ImagesType;
  hasEarlierChron: boolean;
  hasLaterChron: boolean;
}

export default class ChronicleFilemStrip extends React.Component<{}, ChronicleSliderState> {
  constructor(props: {}) {
    super(props);
    this.hasMoreChron = this.hasMoreChron.bind(this);
    this.state = {
      hasEarlierChron: null,
      hasLaterChron: null
    };
    diel.BindOutput("hasMoreChron", this.hasMoreChron, {singleRow: true});
    // this.focusItx = this.focusItx.bind(this);
  }

  // componentDidMount() {
  //   diel.BindOutput("focusItx", this.focusItx, {singleRow: true});
  // }

  hasMoreChron(data: {hasEarlier: number, hasLater: number}) {
    // console.log("has more chron", data, data.hasEarlier, data.hasEarlier === 1);
    this.setState({
      hasLaterChron: data.hasLater as number === 1,
      hasEarlierChron: data.hasEarlier as number === 1
    });
  }

  // loadingSummary(itxIdsInfo: LoadingSummary) {
  //   console.log("loading summary called with info", itxIdsInfo);
  //   this.setState({itxIdsInfo});
  // }

  render() {
    const { hasEarlierChron, hasLaterChron } = this.state;
    // const { width, height } = LayoutInfo.timeLine;
    const strips = [4, 3, 2, 1, 0].map(r => <StripUnit chronRank={r}/>);
    const leftArrow = <span className={`${hasEarlierChron ? "" : "hide"} chronArrow`}
        onClick={() => diel.Input.deltaItx({$val: -1})}
      >⇦</span>;
    const rightArrow = <span className={`${hasLaterChron ? "" : "hide"} chronArrow`}
        onClick = {() => diel.Input.deltaItx({$val: 1})}
      >⇨</span>;
    return <div className="chronContainer">
      {leftArrow}
      {strips}
      {rightArrow}
    </div>;
  }
}
