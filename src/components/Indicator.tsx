import * as React from "react";

interface IndicatorProps {
  chart: string;
  width: number;
  height: number;
}
export const Indicator: React.StatelessComponent<IndicatorProps> = (p) => {
  return <div style={{width: p.width, height: p.height}} >
    <div className="indicator inline-block"></div>
    <p>{p.chart}</p>
  </div>;
};