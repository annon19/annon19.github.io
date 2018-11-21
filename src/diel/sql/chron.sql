create view chronFocusItx AS
  select itxId
  from itxId_SP 
  where ts = (select max(ts) from itxId_SP where itxType != 'navigate');

create view hasMoreChron as
  select
    case when min(a.itxId) - min(c.itxId) < 0 then 1 else 0 end as hasEarlier,
    case when max(a.itxid) > max(c.itxId) > 0 then 1 else 0 end as hasLater
  from
    activeItx a
    join chronItx c;

-- the following must be retrieved by rank
create view chronChartTitle AS
  SELECT
    itxId,
    chronRank,
    isFocus,
    group_concat(
      case when low is not null and low = high then
        chart || ':' || low
      else
        chart || ':' || coalesce( low || '-' || high, substr(selection, 0, 20))
      end, '&') as title
  from chronItxInfo
  group by chronRank;

create view chronLoadingStatus as
  select
    r.itxId as itxId,
    r.chronRank as chronRank,
    count(r.chart) = 4 as loaded
  from (
    select
      d.chart as chart,
      b.itxId as itxId,
      b.chronRank as chronRank
    from
      chronItx b
      join chartDataAtomic d 
        on b.itxId = d.itxId
    union
    select
      e.chart,
      b.itxId as itxId,
      b.chronRank as chronRank
    from 
      chronItx b
      join eqChart_SP e
        on e.newItxId = b.itxId
  ) as r
  group by itxId;


  
-- now fetch the data without worrying about wehther its processing

create view chronDayChartSelection as
  select
    chronRank,
    low,
    high
  from chronItxInfo
    where chart = 'day';

create view chronCarrierChartSelection as
  select
    chronRank,
    selection
  from chronItxInfo
  where chart = 'carrier';

create view chronStateChartSelection as
  select
    chronRank,
    selection
  from chronItxInfo
  where chart = 'state';

create view chronDelaysChartSelection as
  select
    chronRank,
    selection
  from chronItxInfo
  where chart = 'delays';

create view chronDayChartDataView as
  select
    f.itxId,
    f.chronRank,
    d.x,
    d.y
  FROM
    chronDataItx as f
    JOIN dayChartData d
      ON d.itxId = f.dataItxId
      and f.chart = 'day';

create view chronStateChartDataView as
  select
    f.itxId,
    f.chronRank,
    d.x,
    d.y
  FROM
    chronDataItx as f
    JOIN stateChartData d
      ON d.itxId = f.dataItxId
      and f.chart = 'state';
  
create view chronCarrierChartDataView as
  select
    f.itxId,
    f.chronRank,
    d.x,
    d.y
  FROM
    chronDataItx as f
    JOIN carrierChartData d
      ON d.itxId = f.dataItxId
      and f.chart = 'carrier';
  
create view chronDelaysChartDataView as
  select
    f.itxId,
    f.chronRank,
    d.x,
    d.y
    -- d.v as v
  FROM
    chronDataItx as f
    JOIN delaysChartData d
      ON d.itxId = f.dataItxId
      and f.chart = 'delays';