// import * as React from "react";

// import { XFilterSet } from "./XFilterSet";
// import { logEvents } from "../records/XFilter/xFilterSetup";
// import { BrushSelection, EventType } from "../lib/helper";

// interface FilmStripProp {
//   data: {[index: string]: {[index: string]: {x: any, y: number}[]}};
//   selections: {[index: string]: {[index: string]: BrushSelection}};
//   loadedCharts: {[index: string]: string};
//   itxIds: number[];
//   itxInFocus: number;
//   click: (itxId: number) => void;
// }

// // currently just going to be a mini version of
// export const FilmStrip: React.StatelessComponent<FilmStripProp> = (p) => {
//   let { data, selections, loadedCharts, itxIds, itxInFocus } = p;
//   let charts: JSX.Element[] = [];
//   // want increment
//   itxIds.sort((a, b) => a - b);
//   for (let i = 0; i < itxIds.length; i++) {
//     let itxId = itxIds[i];
//     let loaded = loadedCharts ? loadedCharts[itxId] ? loadedCharts[itxId] : "" : "";
//     let d = data[itxId];
//     let s = selections[itxId];
//     // want to call a function to set the state
//     charts.push(<div className={`${(itxInFocus === itxId) ? "film-strip-active" : ""} film-strip`}
//       onClick={(itxInFocus === i) ? null : () => {
//         logEvents(EventType.FilmStripClick);
//         p.click(itxId);
//       }}
//     >
//       <XFilterSet
//         data={d}
//         itxId={itxId}
//         fillerData={null}
//         fillerSelections={null}
//         selections={s}
//         loaded={loaded}
//         control={false}
//         annotations={false}
//         scaleSize={0.2}
//       />
//     </div>);
//   }
//   return <div>{charts}</div>;
// };