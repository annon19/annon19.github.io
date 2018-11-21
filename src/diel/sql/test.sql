hellow world

CREATE VIEW dayChartDataView AS
  SELECT
    f.day AS x,
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
    select selection
    from currentItx
    where chart = 'state'
  ) AS fState
    on (
      instr(fState.selection, f.state)
      or fState.selection IS NULL)
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
      ) or fDelays.low IS NULL)
GROUP BY f.day
order by y desc;
  
CREATE VIEW stateChartDataView AS
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
      ) or fDelays.low IS NULL)
GROUP BY f.state
order by y desc;
  
CREATE VIEW carrierChartDataView AS
  SELECT
    f.carrier AS x,
    COUNT(*) AS y
  FROM flights f
  
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
    where chart = 'state'
  ) AS fState
    on (
      instr(fState.selection, f.state)
      or fState.selection IS NULL)
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
      ) or fDelays.low IS NULL)
GROUP BY f.carrier
order by y desc;
  
CREATE VIEW delaysChartDataView AS
  SELECT
    f.delays AS x,
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
    where chart = 'state'
  ) AS fState
    on (
      instr(fState.selection, f.state)
      or fState.selection IS NULL)
GROUP BY f.delays
order by y desc;
  
