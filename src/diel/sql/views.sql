create view lastBrush as 
  select * from xBrushItx
  where itxId = (
    SELECT MAX(itxId) AS itxId
    FROM xBrushItx
  );

create view lastNavigate as
  select *
  from navigateItx
  where itxId = (
    SELECT MAX(itxId) AS itxId
    FROM navigateItx
  );

create view focusItxRaw as 
  select
    case when n.ts is null or max(b.ts) > max(n.ts)
      then max(b.itxId)
      else n.xFilterItxId
    end + coalesce(delta.val, 0) as itxId
  from lastBrush b
  left outer join lastNavigate n
  left outer join (
    select sum(val) as val
    from deltaItx
  ) as delta;

create view focusItx as
  select
    min(max(f.itxId, b2.minItxId), b2.maxItxId) as itxId,
    b2.minItxId as minItxId,
    b2.maxItxId as maxItxId
  from (
    select
      max(4, coalesce(min(b.itxId), 4)) as minItxId, -- hardcoded
      coalesce(max(b.itxId), 4) as maxItxId
    from xBrushItx b
    join (
      select coalesce(max(ts), 0) as ts
      from deleteItx
    ) as t on b.ts > t.ts
  ) b2
  join focusItxRaw f;

create view focusItxDataItx as
  select
    coalesce(e.oldItxId, f.itxId) as dataItxId,
    ch.chart as chart,
    f.itxId as itxId
  from
    charts ch
    join focusItx f
    left outer join eqChart_SP e
      on e.newItxId = f.itxId
      and e.chart = ch.chart;

create view currentItx as 
  select *
  from xBrushItx b
  where b.itxId in (
    select componentItx
    from brushState_SP 
    where itxId = (select itxId from focusItx)
  );

-- 1 is that it is loading, true
-- however also need to check if the chart was that interacted with
-- if it were, it's not
create view chartProcessing as 
  select
    f.chart as chart,
    case when a.chart is NULL
      then 1 else 0
    end as status
  from focusItxDataItx f
  join xBrushItx b on f.itxId = b.itxid
  left outer join chartDataAtomic a 
    on f.dataItxId = a.itxId
    and a.chart = f.chart;

create view activeItx as
  select
    b.*
  from xBrushItx b
    join (
      select coalesce(max(ts), 0) as ts
      from deleteItx
    ) as t on b.ts > t.ts 
  where b.itxId > 3;

-- hard coding 4 charts here
-- 1 is loading
-- 0 is loaded
-- create view loadingSummary as
--   select
--     r.itxId as itxId,
--     count(r.chart) = 4 as loaded,
--     coalesce(r.low || '-' || r.high , r.selection) as info
--   from (
--     select
--       d.chart as chart,
--       b.itxId as itxId,
--       b.low as low,
--       b.high as high,
--       b.selection as selection
--     from
--       activeItx b
--       join chartDataAtomic d 
--         on b.itxId = d.itxId
--     union
--     select
--       e.chart,
--       b.itxId as itxId,
--       b.low as low,
--       b.high as high,
--       b.selection as selection
--     from 
--       activeItx b
--       join eqChart_SP e
--         on e.newItxId = b.itxId
--   ) as r
--   group by itxId;

---------------------------------
-- individual view for charts
-- a little bit boilder plate...
---------------------------------

-- day
create view dayChartIsLoading as
  select status from chartProcessing where chart = 'day';

create view dayChartSelection as
  select
    low,
    high
  from currentItx
  where chart = 'day';

-- carrier
create view carrierChartIsLoading as
  select status from chartProcessing where chart = 'carrier';

create view carrierChartSelection as
  select
    selection
  from currentItx
  where chart = 'carrier';

-- state
create view stateChartIsLoading as
  select status from chartProcessing where chart = 'state';

create view stateChartSelection as
  select
    selection
  from currentItx
  where chart = 'state';

-- delays
create view delaysChartIsLoading as
  select status from chartProcessing where chart = 'delays';

create view delaysChartSelection as
  select
    selection
    -- low2,
    -- high2
  from currentItx
  where chart = 'delays';

-- data views

create view dayChartDataView as
  select
    d.x,
    d.y
  FROM
    focusItxDataItx as f
    JOIN dayChartData d
      ON d.itxId = f.dataItxId
      and f.chart = 'day';
  
create view stateChartDataView as
  select
    d.x,
    d.y
  FROM
    focusItxDataItx as f
    JOIN stateChartData d
      ON d.itxId = f.dataItxId
      and f.chart = 'state';
  
create view carrierChartDataView as
  select
    d.x,
    d.y
  FROM
    focusItxDataItx as f
    JOIN carrierChartData d
      ON d.itxId = f.dataItxId
      and f.chart = 'carrier';
  
create view delaysChartDataView as
  select
    d.x,
    d.y
    -- d.v as v
  FROM
    focusItxDataItx as f
    JOIN delaysChartData d
      ON d.itxId = f.dataItxId
      and f.chart = 'delays';