create table chronItx (
  itxId integer not null,
  chronRank integer not null,
  isFocus integer not null
);

create table chronItxInfo (
  chronRank INTEGER NOT NULL,
  isFocus INTEGER NOT NULL,
  itxId INTEGER NOT NULL,
  ts INTEGER NOT NULL,
  chart TEXT NOT NULL,
  -- this is used for set specific selections; e.g., carrier
  selection TEXT,
  low INTEGER,
  high INTEGER,
  -- the following 2 are for two dimensional filters
  low2 INTEGER,
  high2 INTEGER
);

create table chronDataItx (
  dataItxId INTEGER NOT NULL,
  chart TEXT NOT NULL,
  itxId INTEGER NOT NULL,
  chronRank INTEGER NOT NULL
);

create trigger tickTrigger after insert on tick
BEGIN
  -- 1
  delete from chronItx;
  insert into chronItx
  select
    n as itxId,
    s.itxId - n as chronRank,
    n = f.itxId as isFocus
  from focusItx f
    join chronFocusItx s
    join numbers v
      on v.n >= max(f.minItxId, s.itxId - 4)
      and v.n <= min(f.maxItxId, s.itxId);
  -- 2
  delete from chronDataItx;
  insert into chronDataItx
    select
    coalesce(e.oldItxId, f.itxId) as dataItxId,
    ch.chart as chart,
    f.itxId as itxId,
    f.chronRank as chronRank
  from
    charts ch
    join chronItx f
    left outer join eqChart_SP e
      on e.newItxId = f.itxId
      and e.chart = ch.chart;
  -- 3
  delete from chronItxInfo;
  insert into chronItxInfo
  select
    t.chronRank as chronRank,
    t.isFocus as isFocus,
    b.*
  from xBrushItx b 
    join (
      select
        sp.componentItx as itxId,
        c.chronRank as chronRank,
        c.isFocus as isFocus
      from brushState_SP sp
        join chronItx c
        on sp.itxId = c.itxId
    ) t on b.itxId = t.itxId;
  -- final
  SELECT tick();
end;