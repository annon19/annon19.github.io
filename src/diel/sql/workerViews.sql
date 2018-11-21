-- maybe add cancelled?
create table charts (
  chart text
);
insert into charts values ('day'), ('state'), ('carrier'), ('delays');

create view dayChartInitDataView as
  SELECT
    day AS x,
    COUNT(*) AS y
  FROM flights
  GROUP BY day;

CREATE view stateChartInitDataView AS
  SELECT
    state AS x,
    COUNT(*) AS y
  FROM flights
  GROUP BY state
  order by y desc;

CREATE view carrierChartInitDataView AS
  SELECT
    carrier AS x,
    COUNT(*) AS y
  FROM flights
  GROUP BY carrier
  order by y desc;

CREATE view delaysChartInitDataView AS
  SELECT
    delay as x,
    count(*) as y
  from flights
  group by delay
  ORDER BY length(delay);

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
    select selection
    from currentItx
    where chart = 'delays'
    ) AS fDelays
    on (
      (
        instr(fDelays.selection, f.delay)
      -- and f.arr_delay <= fDelays.high
      -- and f.dep_delay >= fDelays.low2
      -- and f.dep_delay < fDelays.high2
      ) or fDelays.selection IS NULL)
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
    select selection
    from currentItx
    where chart = 'delays'
    ) AS fDelays
    on (
      (
        instr(fDelays.selection, f.delay)
        -- f.arr_delay >= fDelays.low
        -- and f.arr_delay <= fDelays.high
        -- and f.dep_delay >= fDelays.low2
        -- and f.dep_delay < fDelays.high2
      ) or fDelays.selection IS NULL)
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
    select selection
    from currentItx
    where chart = 'delays'
    ) AS fDelays
    on (
      (
        instr(fDelays.selection, f.delay)
        -- f.arr_delay >= fDelays.low
        -- and f.arr_delay <= fDelays.high
        -- and f.dep_delay >= fDelays.low2
        -- and f.dep_delay < fDelays.high2
      ) or fDelays.selection IS NULL)
GROUP BY f.carrier
order by y desc;
  
CREATE VIEW delaysChartDataView AS
  SELECT
    delay as x,
    -- dep_delay as y,
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
GROUP BY delay
ORDER BY length(delay);