import * as React from "react";
import * as d3 from "d3";

import { ResetButton } from "../ResetButton";
import { diel } from "../../diel/setup";
import {  RangeSelection, BarChartDataType, StringSelection,
  DefaultChartProps, SharedChartProps,
  ChartHelperReturnValue, IsLoading, LayoutInfo} from "../../lib/chart/chartHelper";

import { linearChartHelper, LinearChartProps } from "../../lib/chart/LinearChartHelper";
import { CategoricalChartHelper, CategoricalChartProps } from "../../lib/chart/CategoricalChartHelper";

interface BarChartProps extends SharedChartProps {
  isCategorical: boolean;
  clipped: boolean;
}

interface BarChartState {
  baseData: BarChartDataType;
  isLoading: IsLoading;
  data?: BarChartDataType;
  selection?: RangeSelection | StringSelection;
}

export default class BarChart extends React.Component<BarChartProps, BarChartState> {
  static defaultProps = DefaultChartProps;

  constructor(props: BarChartProps) {
    super(props);
    this.refreshSelection = this.refreshSelection.bind(this);
    this.refreshData = this.refreshData.bind(this);
    this.refreshIsLoading = this.refreshIsLoading.bind(this);
    const deChronName = props.isChron ? props.chart.slice(5).toLowerCase() : props.chart;
    this.state = {
      baseData: diel.GetStaticView(`${deChronName}ChartInitData`) as BarChartDataType,
      isLoading: props.isChron ? {status: 0} : {status: 1}
    };
  }

  refreshSelection(selection: RangeSelection | StringSelection) {
    this.setState({ selection });
  }

  refreshData(data: BarChartDataType) {
    this.setState({data});
  }

  refreshIsLoading(isLoading: IsLoading) {
    this.setState({
      isLoading
    });
  }

  componentDidMount() {
    const { chart, isChron, chronRank } = this.props;
    if (!isChron) {
      diel.BindOutput(`${chart}ChartIsLoading`, this.refreshIsLoading, {singleRow: true});
      diel.BindOutput(`${chart}ChartDataView`, this.refreshData);
      diel.BindOutput(`${chart}ChartSelection`, this.refreshSelection, {singleRow: true});
    } else {
      const parameters = {$chronRank: chronRank};
      diel.BindOutput(`${chart}ChartDataView`, this.refreshData, {singleRow: false, parameters});
      diel.BindOutput(`${chart}ChartSelection`, this.refreshSelection, {singleRow: true, parameters});
    }
  }

  render() {
    // yLabel
    let { chart, xLabel, isCategorical, clipped, isChron } = this.props;

    if (!(this.state && this.state.baseData) || (this.state.baseData.length === 0))  {
      throw new Error(`Data for chart ${chart} should be here already`);
    }
    // should refactor the following...
    const {marginTop, marginRight, marginLeft, marginBottom} = LayoutInfo[chart];
    let { width, height, verticalOrientation } = LayoutInfo[chart];
    let { baseData, selection, data, isLoading } = this.state;

    if (isChron && (!data || data.length === 0)) {
      return <div
          className="chart-container bar-chart"
          style={{width: verticalOrientation ? width : height, height: verticalOrientation ? height : width}}>
        </div>;
    }
    const chartWidth = width! - marginLeft! - marginRight!;
    const chartHeight = height! - marginTop! - marginBottom!;

    let content: JSX.Element;
    let r: ChartHelperReturnValue;
    if (isCategorical) {
      r = CategoricalChartHelper({
        baseData, data, selection, chart, chartWidth, chartHeight, clipped
      } as CategoricalChartProps);
    } else {
      r = linearChartHelper({
        baseData, data, selection, chart, chartWidth, chartHeight, clipped
      } as LinearChartProps);
    }
    // console.log("returned r", r);

    let brushDiv: JSX.Element;
    // brushing related
    if (!isChron) {
      const brush = d3.brushX()
      .extent([[0, 0], [chartWidth, chartHeight]])
      .on("start", function() {
        // TODO
        // console.log("brush started");
      })
      .on("end", function() {
        // see https://github.com/d3/d3-brush/issues/10
        if (!d3.event.sourceEvent) return; // Only transition after input.
        if (!d3.event.selection) return; // Ignore empty selections.
        const s = d3.brushSelection(this) as [number, number];
        if (s !== null) {
          r.brushFn(Math.min(s[0], s[1]), Math.max(s[0], s[1]));
        }
        d3.select(this).call(brush.move, null);
      });
      brushDiv = <g ref={ g => d3.select(g).call(brush as any) }></g>;
    }

    // axis rlated
    const tickNum = 5;
    const maxYvalue = this.props.clipped
                        ? tickNum
                        : this.state.data
                          ? Math.min(Math.max(...(this.state.data as any).map((d: any) => d.y)), tickNum)
                          : tickNum;
    const xTicks = baseData.length;
    let xAxis = d3.axisBottom(r.x).ticks(xTicks);
    let yAxis = d3.axisLeft(r.y).ticks(maxYvalue, "d").tickSizeOuter(0);
    const tickXClassName = verticalOrientation ? "" : "rotate90x";
    const tickYClassName = verticalOrientation ? "textRotate30" : "rotate90y";
    const ticks = <>
      <g ref={(g) => {d3.select(g).call(yAxis as any); }}
        transform={verticalOrientation ? "" : `translate(${chartWidth}, 0)`}
          className={tickXClassName}></g>
      <g ref={(g) => { d3.select(g).call(xAxis as any); }}
        transform={`translate(0,` + chartHeight + ")"}
        className={tickYClassName}></g></>;
    const axesLabels = (
      <g>
        <text
          className="chart-label"
          x={verticalOrientation ? (chartWidth / 2) + marginLeft : 10}
          y={verticalOrientation ? height - 5 : width / 2}
          transform={verticalOrientation ? `` : `rotate(-90, ${10}, ${width / 2})`}
          textAnchor="middle"
        > {xLabel}
        </text>
      </g>);

    let xFilterBars = r.rectsSpec.map(d => {
      if (isNaN(d.x)) {
        console.log(d, chart, r.rectsSpec);
        throw new Error(`found the nan`);
      }
      return (<rect
                className={d.className ? d.className : "select-bars"}
                x={d.x}
                y={d.y}
                width={d.barWidth}
                height={chartHeight - d.y}
                fill={d.color}
                onClick={isChron ? null : d.onClick}
                ></rect>);
    });
    // put them together
    let wrap: JSX.Element;
    let transformedWidth = width;
    let transformedHeight = height;
    // note that brush need to have lower z-index because otherwise clicking would not be captured.
    let innerContent = <g transform={`translate(${marginLeft}, ${marginTop})`} >
        {ticks}
        {brushDiv}
        {xFilterBars}
      </g>;
    if (verticalOrientation) {
      wrap = innerContent;
    } else {
      transformedWidth = height;
      transformedHeight = width;
      // ${height / 2} apparently 0 works well
      wrap = <g transform={`translate(${transformedWidth}, 0) rotate(90)`}>{innerContent}</g>;
    }

    content = <svg width={transformedWidth} height={transformedHeight} className="chart-svg">
      {wrap}
      {isChron ? null : axesLabels}
    </svg>;
    const loadingClass = (!isChron && isLoading.status === 1) ? "indicatorLine" : "";

    let selectionText;
    if (isCategorical) {
      selectionText = this.state.selection ?
        (this.state.selection as StringSelection).selection
        : null;
      selectionText = selectionText
        ? selectionText.length > 10
          ? selectionText.slice(0, 10) + "..."
          : selectionText
        : null;
    } else {
      // get it if it's the same value
      if (this.state.selection) {
        const low = (this.state.selection as RangeSelection).low;
        const high = (this.state.selection as RangeSelection).high;
        if (low) {
          if (low === high) {
            selectionText = `${low}`;
          } else {
            selectionText = `${low} to ${high}`;
          }
        }
      }
    }
    return(<div className="chart-container bar-chart">
      {isChron
        ? null
        : <div style={{height: 20, overflow: "hidden"}}>
            <p className="chart-filter">{selectionText ? `selected ${selectionText}` : " "}</p>
          </div>}
      {content}
      <div style={{height: 5}} className={loadingClass}></div>
      <div>
      {isChron ? null :  <ResetButton
          width={transformedWidth}
          disabled={!r.hasSelection}
          chart={chart}
          selection={selectionText}
        />}
      </div>
    </div>);
  }
}