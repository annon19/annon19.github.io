function genWorker() {
  let s = "";
  const charts = ["day", "state", "carrier", "delays"];
  const day = `
  JOIN (
    select low, high
    from currentItx
    where chart = 'day'
  ) AS fDay
    on (
      (f.day <= fDay.high and f.day >= fDay.low)
      or fDay.low IS NULL)`;

  const delays = `
    JOIN (
      select low, high, low2, high2
      from currentItx
      where chart = 'delays'
      ) AS fDelays
      on (
        (
          f.arr_delay >= fDelays.low
          and f.arr_delay <= fDelays.high
          and f.dep_delay >= fDelays.low2
          and f.dep_delay < fDelays.high2
        ) or fDelays.low IS NULL)`;

  const state = `
    JOIN (
      select selection
      from currentItx
      where chart = 'state'
    ) AS fState
      on (
        instr(fState.selection, f.state)
        or fState.selection IS NULL)`;

  const carrier = `
    JOIN (
      select selection
      from currentItx
      where chart = 'carrier'
    ) AS fCarrier
      on (instr(fCarrier.selection, f.carrier)
        or fCarrier.selection IS NULL)`;

  const sql: {[index: string]: string} = {
    carrier,
    day,
    state,
    delays
  };
  charts.map(c => {
    let joins = "";
    Object.keys(sql).map(q => {
      if (q !== c) {
        joins += sql[q];
      }
    });
    if (c !== "delays") {
      s += `
  CREATE VIEW ${c}ChartDataView AS
    SELECT
      f.${c} AS x,
      COUNT(*) AS y
    FROM flights f
    ${joins}
    GROUP BY f.${c}
    order by y desc;
  `;
    } else {
      // getting rid of the scatter plot
      // dep_delay as y,
      s += `
  CREATE VIEW delaysChartDataView AS
    SELECT
      arr_delay as x,
      COUNT(*) AS y
    FROM flights f
    ${joins}
    GROUP BY arr_delay
  `;
    }
  });
  return s;
}
console.log(genWorker());
