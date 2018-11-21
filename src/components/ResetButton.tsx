import * as React from "react";

import { diel } from "../diel/setup";

interface ResetButtonProps {
  width: number; // width should be the same as the chart
  chart: string;
  disabled: boolean;
  selection: string;
}

export const ResetButton: React.StatelessComponent<ResetButtonProps> = (p) => {
  if (p.selection && p.selection.length > 0) {
    return <div style={{height: 30, width: p.width, overflow: "hidden"}}>
      <button
        style={{ marginBottom: 10 }}
        onClick={() => diel.Input.xBrushItx({$chart: p.chart})}>
          reset
      </button>
    </div>;
  } else {
    return <div style={{height: 30, width: p.width}}>
    </div>;
  }
};
