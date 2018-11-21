import * as React from "react";
import * as Prism from "prismjs";

import { diel } from "../diel/setup";
import { QueryResults } from "sql.js";

interface WalkthroughState {
  step: number;
  result?: QueryResults;
}

interface Explanation {
  queryShown: string;
  // if queryRan is not defined, then nothing is ran.
  queryRan?: string;
  ifRefresh: boolean;
  text: string;
}

const Explanations: Explanation[] = [
  {
    queryShown: `create view dayChartInitDataView as
      SELECT
        day AS x,
        COUNT(*) AS y
      FROM flights
      GROUP BY day;`,
    ifRefresh: false,
    text: `The view <i>dayChartInitDataView</i> shows using SQL to query for the static data`,
  },
  {
    queryShown: `create view lastBrush as
      select * from xBrushItx
      where itxId = (
        SELECT MAX(itxId) AS itxId
        FROM xBrushItx
      );`,
    queryRan: `select * from lastBrush`,
    ifRefresh: true,
    text: `This query derives the latest brush performed; based on the last brush, we can combine with the navigation interactions to define what the combined view is next.`,
  },
  {
    queryShown: `create view focusItx as
      select b.itxId + coalesce(delta.val, 0) as itxId
      from lastBrush b
      left outer join (
      select sum(val) as val
      from deltaItx
    ) as delta;`,
    queryRan: `select * from focusItxRaw`,
    ifRefresh: true,
    text: `Here to combine the navigation with that of the delta navigation interactions, we can just add from past events. There are some additional logic for checking if navigation is out of bounds, which we omit here.`
  },
  {
    queryShown: `create view currentItx as
      select *
      from xBrushItx b
      where b.itxId in (
        select componentItx
        from brushState_SP
        where itxId = (select itxId from focusItx)
      );`,
    ifRefresh: true,
    queryRan: `select * from currentItx`,
    text: `This query illustrates how to make use of state programs to simplify finding the brushes defined in the past. <i>brushState_SP</i> is a state program table that's modified after each <i>xBrushItx</i> to reflect the active set of selected filters. Then <i>currentIt</i> is shared with the WebWorker thread that's computing the values and the response is inserted backed into main thread db as another event---into the respective tables <i>stateChartData</i>.`
  },
  {
    queryShown: `CREATE VIEW stateChartDataView AS
      SELECT
        f.state AS x,
        COUNT(*) AS y
      FROM flights f
      JOIN (
        select selection
        from currentItx
        where chart = 'carrier'
      ) AS fCarrier
        on (instr(fCarrier.selection, f.carrier)
          or fCarrier.selection IS NULL)
      JOIN (
        select low, high
        from currentItx
        where chart = 'day'
      ) AS fDay
        on (
          (f.day <= fDay.high and f.day >= fDay.low)
          or fDay.low IS NULL)
      JOIN (
        select selection
        from currentItx
        where chart = 'delays'
      ) AS fDelays
        on (
          instr(fDelays.selection, f.delay)
          or fDelays.selection IS NULL
        )
    GROUP BY f.state
    order by y desc;`,
    ifRefresh: false,
    text: `This is the query ran on the worker that takes the interact records and computes the filter as one wholistic query. Note that this unified programming model---all the way from interactions to data processing eliminates the need to transform the data from events to objects and to some query language to the backend (or workers), or worse yet, custom rolled functions instead of a standard query engine.`
  }
];

export default class Walkthrough extends React.Component<{}, WalkthroughState> {
  constructor(props: {}) {
    super(props);
    this.next = this.next.bind(this);
    this.prev = this.prev.bind(this);
    this.updateQuery = this.updateQuery.bind(this);
    this.state = {
      step: 0,
      result: null
    };
    this.updateQuery();
  }

  updateQuery() {
    const e = Explanations[this.state.step];
    let result = null;
    if (e.queryRan) {
      result = diel.exec(e.queryRan)[0];
    }
    this.setState({result});
  }
  next() {
    this.setState(prevState => ({step: prevState.step + 1 }));
  }
  prev() {
    this.setState(prevState => ({step: prevState.step - 1 }));
  }
  componentDidMount() {
    Prism.highlightAll();
  }

  render() {
    const result = this.state.result;
    const e = Explanations[this.state.step];
    let resultEle: JSX.Element;
    if (result && e.queryRan) {
      resultEle = <table style={{fontFamily: "courier"}}>
         <thead>
           {result.columns.map(c => <th>{c}</th>)}
         </thead>
         <tbody>
           {result.values.map(r => (<tr>{r.map((c, i) => {
             let cell = result.columns[i] === "ts" ? new Date(c as number).getHours() + ":" + new Date(c as number).getMinutes() + ":" + new Date(c as number).getSeconds() : c;
             cell = ((result.columns[i].toLowerCase().indexOf("lat") > -1) || (result.columns[i].toLowerCase().indexOf("long") > -1)) ? Math.round(cell as number * 100) / 100 : cell;
             return (<td>{cell}</td>);
           })}</tr>))}
         </tbody>
       </table>;
    }
    if (e.queryRan) {
      const result = diel.exec(e.queryRan)[0];
      resultEle = <table style={{fontFamily: "courier"}}>
         <thead>
           {result.columns.map(c => <th>{c}</th>)}
         </thead>
         <tbody>
           {result.values.map(r => (<tr>{r.map((c, i) => {
             let cell = result.columns[i] === "ts" ? new Date(c as number).getHours() + ":" + new Date(c as number).getMinutes() + ":" + new Date(c as number).getSeconds() : c;
             cell = ((result.columns[i].toLowerCase().indexOf("lat") > -1) || (result.columns[i].toLowerCase().indexOf("long") > -1)) ? Math.round(cell as number * 100) / 100 : cell;
             return (<td>{cell}</td>);
           })}</tr>))}
         </tbody>
       </table>;
    }
    return <>
      <p dangerouslySetInnerHTML={{ __html: e.text}}></p>
      <button className="general-btn vis-btn" disabled={this.state.step < 1} onClick={this.prev}>Previous</button>
      <button className="general-btn vis-btn" disabled={this.state.step >= Explanations.length - 1} onClick={this.next}>Next</button>
      {e.ifRefresh ? <button className="general-btn vis-btn" onClick={this.updateQuery}>Refresh Query</button> : null}
      <pre>
        <code className="language-sql">
          {e.queryShown}
        </code>
      </pre>
      {resultEle}
    </>;
  }
}