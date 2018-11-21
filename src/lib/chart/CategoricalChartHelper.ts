import * as d3 from "d3";

import { diel } from "../../diel/setup";

import { lightGray, lightBlue, selectedColor, selectedBackgroundColor, brushColor,
  ChartHelperReturnValue, StringSelection,
  RectSVGSpec, CategoricalBarChartType} from "./chartHelper";

export interface CategoricalChartProps {
  selection: StringSelection;
  baseData: CategoricalBarChartType;
  data: CategoricalBarChartType;
  chart: string;
  chartWidth: number;
  chartHeight: number;
  clipped: boolean;
}

export function CategoricalChartHelper(p: CategoricalChartProps): ChartHelperReturnValue {
    let { baseData, selection, data, chart, chartWidth, chartHeight, clipped } = p;
    const unclippable = (!clipped) && data && (data.length > 0);
    // scale realted
    const yMax = unclippable ? d3.max(data, d => d.y) : d3.max(baseData, (d) => d.y)!;
    let y = d3.scaleLinear().rangeRound([chartHeight, 0]).domain([0, yMax]);
    const xDomain = baseData.map(d => d.x);
    const x = d3.scaleBand().rangeRound([0, chartWidth]).padding(0.4).domain(xDomain);

    // brushing related
    const brushFn = (x1: number, x2: number) => {
      const selectionOrdinal = xDomain.filter(v => x(v) && (x(v)! < x2) && (x(v)! > x1)).join(",");
      diel.Input.xBrushItx({$selection: selectionOrdinal, $chart: chart});
    };
    const clickFn = (x: string) => () => diel.Input.xBrushItx({$selection: x, $chart: chart});
    const barWidth = x.bandwidth();
    let rectsSpec: RectSVGSpec = [];
    let brushBounds: number[] = [];
    if (selection && selection.selection) {
      selection.selection.split(",").map(s => brushBounds.push(x(s)));
    }
    // if the value is too low, then also clip on a background selection, but only at the height of half
    baseData.map(d => {
      rectsSpec.push({
        x: x(d.x)!,
        y: chartHeight / 2!,
        color: "rgba(0, 0, 0, 0)",
        onClick: clickFn(d.x),
        barWidth,
      });
    });
    unclippable ? [] : baseData.map(d => {
      let color = lightGray;
      if (selection && selection.selection) {
        const selects = selection.selection.split(",");
        if (selects.filter(s => s === d.x).length > 0) {
          // console.log("highlighted selection", selection.selection, d.x);
          color = selectedBackgroundColor;
        }
      }
      rectsSpec.push({
        x: x(d.x)!, y: y(d.y)!,
        color,
        onClick: clickFn(d.x),
        barWidth,
      });
    });
    if (data) {
      data.filter(d => d.y > 0).map(d => {
        let color = lightBlue;
        if (selection && selection.selection) {
          const selects = selection.selection.split(",");
          if (selects.filter(s => s === d.x).length > 0) {
            color = selectedColor;
          }
        }
        rectsSpec.push({
          x: x(d.x)!, y: y(d.y)!,
          color,
          onClick: clickFn(d.x),
          barWidth
        });
      });
    }
    if (brushBounds.length > 0) {
      rectsSpec.push({
        className: "selector",
        x: Math.max(d3.min(brushBounds) - 5, 0),
        y: 0,
        color: brushColor,
        barWidth: d3.max(brushBounds) - d3.min(brushBounds) + barWidth + 10,
        onClick: null
      });
    }
    const hasSelection: boolean = (selection && selection.selection) ? true : false;
    // if (chart === "delays" && chartWidth < 60) {
    //   console.log("rectsSpec for delays", rectsSpec);
    // }
    return {
      brushFn,
      rectsSpec,
      x,
      y,
      hasSelection
    };
  }