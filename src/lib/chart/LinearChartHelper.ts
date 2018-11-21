import * as d3 from "d3";

import { diel } from "../../diel/setup";
import { lightGray, lightBlue, selectedColor, brushColor,
  RectSVGSpec, selectedBackgroundColor, ChartHelperReturnValue,
  LinearBarChartType, RangeSelection} from "./chartHelper";


export interface LinearChartProps {
  selection: RangeSelection;
  baseData: LinearBarChartType;
  data: LinearBarChartType;
  chart: string;
  chartWidth: number;
  chartHeight: number;
  clipped: boolean;
}

export function linearChartHelper(p: LinearChartProps): ChartHelperReturnValue {
  let { baseData, selection, data, chart, chartWidth, chartHeight, clipped } = p;
  const unclippable = (!clipped) && data && (data.length > 0);

  const yMax = unclippable ? d3.max(data, d => d.y) : d3.max(baseData, (d) => d.y)!;
  let y = d3.scaleLinear().rangeRound([chartHeight, 0]).domain([0, yMax]);
  const extent = d3.extent(baseData, d => d.x);
  const numBars = (extent[1] - extent[0] + 1);
  const xDomain = [extent[0], extent[1] + (extent[1] - extent[0]) / numBars];
  const barWidth = chartWidth * 0.6 / numBars;
  const x = d3.scaleLinear().rangeRound([1, chartWidth]).domain(xDomain);

  const brushFn = (x1: number, x2: number) => {
    let v1 = Math.round(x.invert(x1));
    let v2 = Math.floor(x.invert(x2));
    console.log("brush data", v1, v2);
    diel.Input.xBrushItx({$low: v1, $high: v2, $chart: chart});
  };
  const clickFn = (x: number) => () => diel.Input.xBrushItx({$low: x, $high: x, $chart: chart});

  let rectsSpec: RectSVGSpec = [];

  const hasSelection: boolean = (selection && selection.low) ? true : false;
  // <rect
  // className="chart-label"
  // x={x(selection.low)}
  // y={y(selection.high2)}
  // width={x(selection.high) - x(selection.low)}
  // height={Math.abs(y(selection.high2) - y(selection.low2))}
  // fill={"gray"}
  // fill-opacity="0.3"
  // ></rect>


  unclippable ? [] : baseData.map(d => {
    const color = selection
      ? (d.x <= selection.high && d.x >= selection.low)
        ? selectedBackgroundColor
        : lightGray
      : lightGray;
    rectsSpec.push({
      x: x(d.x)!,
      y: y(d.y)!,
      color,
      onClick: clickFn(d.x),
      barWidth,
    });
  });
  if (data) {
    data.filter(d => d.y > 0).map(d => {
      const color = selection
        ? (d.x <= selection.high && d.x >= selection.low)
          ? selectedColor
          : lightBlue
        : lightBlue;
      rectsSpec.push({
        x: x(d.x),
        y: y(d.y),
        color,
        onClick: clickFn(d.x),
        barWidth,
      });
    });
  }

  if (hasSelection) {
    // this has to be pushed back otherwise click are going to be hard to register...
    rectsSpec.push({
      className: "selector",
      x: Math.max(x(selection.low) - 5, 0),
      y: 0,
      barWidth: x(selection.high) - x(selection.low) + barWidth + 10, // need to be double of 5 duh
      color: brushColor,
      onClick: null
    });
  }
  // console.log(`rectspec is`, chartWidth, barWidth, JSON.stringify(rectsSpec));
  return {
    brushFn,
    rectsSpec,
    x,
    y,
    hasSelection
  };
}