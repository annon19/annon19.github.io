import { AxisScale } from "d3";

export const lightBlue = "rgba(76, 120, 168, 0.5)";
export const selectedColor = "orange";
export const scatterDark = "darkblue";
export const scatterLight = "LemonChiffon";
export const scatterBaseDark = "lightgray";
export const scatterBaseLight = "darkgray";
export const lightGray = "rgba(0, 0, 0, 0.07)";
export const selectedBackgroundColor = "rgba(255, 165, 0, 0.4)";
export const brushColor = "rgba(128,128,128, 0.3)";

// should be boolean but sqlite does not have boolean type
 export type IsLoading = {status: number};
export type LinearBarChartType = { x: number; y: number; }[];
export type CategoricalBarChartType = { x: string; y: number; }[];
export type BarChartDataType = CategoricalBarChartType | LinearBarChartType;
export type ScatterPlotDataType = {x: number, y: number, v: number}[];
export type RectSVGSpec = {
  x: number,
  y: number,
  color: string,
  onClick: () => void,
  barWidth: number,
  className?: string;
}[];

export interface RangeSelection {low: number; high: number; }
export interface StringSelection { selection: string; }

export interface RectSection {
  low: number;
  low2: number;
  high: number;
  high2: number;
}
export type BrushSelection = string
                            | RangeSelection
                            | RectSection;

export type ChartHelperReturnValue = {
    brushFn: (low: number, high: number) => void;
    rectsSpec: RectSVGSpec;
    x: AxisScale<any>;
    y: AxisScale<any>;
    hasSelection: boolean;
  };

export const LayoutInfo: {[index: string]: {
  width: number, height: number,
  marginTop: number,
  marginLeft: number,
  marginRight: number,
  marginBottom: number,
  verticalOrientation?: boolean
}} = {
  timeLine: {
    width: 750,
    height: 80,
    marginBottom: 40,
    marginLeft: 40,
    marginRight: 50,
    marginTop: 25,
  },
  delays: {
    width: 100,
    height: 300,
    marginTop: 1,
    marginBottom: 60,
    marginLeft: 40,
    marginRight: 10,
    verticalOrientation: true
  },
  chronDelays: {
    width: 35,
    height: 70,
    marginTop: 1,
    marginBottom: 1,
    marginLeft: 1,
    marginRight: 1,
    verticalOrientation: true
  },
  // flipped
  carrier: {
    width: 300,
    height: 150,
    marginLeft: 1,
    marginTop: 10,
    marginBottom: 60,
    marginRight: 50,
    verticalOrientation: false,
  },
  chronCarrier: {
    width: 70,
    height: 35,
    marginTop: 1,
    marginBottom: 1,
    marginLeft: 1,
    marginRight: 1,
    verticalOrientation: false
  },
  state: {
    width: 300,
    height: 150,
    marginLeft: 1,
    marginTop: 10,
    marginBottom: 40,
    marginRight: 50,
    verticalOrientation: false,
  },
  chronState: {
    width: 70,
    height: 35,
    marginTop: 1,
    marginBottom: 1,
    marginLeft: 1,
    marginRight: 1,
    verticalOrientation: false
  },
  // flipped
  day: {
    width: 300,
    height: 150,
    marginLeft: 1,
    marginTop: 10,
    marginBottom: 40,
    marginRight: 50,
    verticalOrientation: false,
  },
  chronDay: {
    width: 70,
    height: 35,
    marginTop: 1,
    marginBottom: 1,
    marginLeft: 1,
    marginRight: 1,
    verticalOrientation: false
  }
};

export interface SharedChartConfig {
  baseFill: string;
  selectFill: string;
  showIntro: boolean;
  annotations: boolean;
  verticalOrientation: boolean;
  debug: boolean;
  isChron: boolean;
  chronRank: number;
}

export interface SharedChartProps extends Partial<SharedChartConfig> {
  chart: string;
  // the following are all provided directly via configurations
  // height: number;
  // width: number;
  // marginBottom: number;
  // marginLeft: number;
  // marginRight: number;
  // marginTop: number;
  xLabel: string;
  yLabel: string;
}

export const DefaultChartProps: SharedChartConfig = {
  baseFill: lightBlue,
  showIntro: false,
  selectFill: selectedColor,
  annotations: true,
  verticalOrientation: true,
  debug: false,
  isChron: false,
  chronRank: -1
};

export function rectContains(bounds: RectSection, x: number, y: number) {
  if (!bounds) return false;
  return ((x < bounds.high && x > bounds.low) && (y < bounds.high2) && (y > bounds.low2));
}

export function rectToString(selected: RectSection) {
  if (selected && selected.low && selected.high && selected.low2 && selected.high2) {
    return selected.low.toString() + selected.high.toString() + selected.low2.toString() + selected.high2.toString();
  } else {
    return "";
  }
}


function isRect(object: any): object is RectSection {
  return "x1" in object && "x2" in object;
}

// it's amazing that the syntax highligher knows the following is correct...
export function hasBrushSelection(s: BrushSelection | RectSection): boolean {
  if (s) {
    if (typeof s === "string") {
      return (s.length > 0);
    } else if (isRect(s)) {
      return (s.low && s.high && s.low2 && s.high2) ? true : false;
    } else {
      return (s.low && s.high) ? true : false;
    }
  }
  return false;
}