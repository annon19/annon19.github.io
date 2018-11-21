CREATE TRIGGER afterBrushItx_SP AFTER INSERT ON xBrushItx
BEGIN
  delete from deltaItx;
  insert into brushDep_SP (itxId, pastItxId)
    select new.itxId, f.itxId
    from itxId_SP f
    where ts = (select max(ts) from itxId_SP)
  ;
  -- this MUST happen after
  insert into itxId_SP (itxId, ts, itxType)
    select new.itxId, timeNow(), 'brush'
  ;
  -- again, order is needed
  insert into brushState_SP (itxId, chart, componentItx)
    select
      new.itxId,
      s.chart,
      s.componentItx
    from
      brushState_SP s
      join brushDep_SP dep on s.itxId = dep.pastItxId
    where
      dep.itxId = new.itxId
      and s.chart != new.chart;
  -- then itself
  insert into brushState_SP (itxId, chart, componentItx)
    select new.itxId, new.chart, new.itxId;
  -- then fetch data
  -- fixme: might not be needed
  select workerShareItx();
  -- caching logic begins
  insert into dataParamHashes_SP (itxId, chart, hashVal) 
    select
      new.itxId,
      ch.chart,
      group_concat(
        c.chart 
        || ':' 
        || IFNULL(c.selection, 'NULL') 
        || ',' 
        || IFNULL(c.low, 'NULL')
        || ',' 
        || IFNULL(c.high, 'NULL')
        || ',' 
        || IFNULL(c.low2, 'NULL') 
        || ',' 
        || IFNULL(c.high2, 'NULL'),
        '-'
      )
    from charts ch
    join currentItx c 
    where c.chart != ch.chart
    group by ch.chart;
  -- completes caching logic
  insert into eqChart_SP (newItxId, chart, oldItxId)
    select
      newP.itxId, newP.chart, min(oldP.itxId)
    from (
      select * from dataParamHashes_SP where itxId = new.itxId
    ) as newP
    join (
      select * from dataParamHashes_SP p where itxId < new.itxId
    ) as oldP
      -- going to assume that the group by is determinstic, bad assuption here
      -- obviously the chart will have to be the same as well
      on newP.chart = oldP.chart
      and hashCompare(newP.hashVal, oldP.hashVal) = 1
      group by newP.itxId, newP.chart;
  -- selective data request
  select
    case when e.oldItxId is null
    then workerGetChartDataView(NEW.itxId, ch.chart)
    else log(NEW.itxId, 'cached data') end
  from
    charts ch
    left outer join eqChart_SP e
      on ch.chart = e.chart
      and e.newItxId = new.itxId;
  insert into tick (timestep) values (null);
END;

create trigger afterNavItx_SP after insert on navigateItx
BEGIN
  insert into itxId_SP (itxId, ts, itxType)
    select new.xFilterItxId, timeNow(), 'navigate';
  delete from deltaItx;
  insert into tick (timestep) values (null);
end;

create trigger afterDeleteItx_SP after insert on deleteItx
BEGIN
  insert into itxId_SP (itxId, ts, itxType) values (4, timeNow(), 'delete');
  delete from deltaItx;
  insert into tick (timestep) values (null);
end;

-- the other ticks were done in the respective fire --- in general, there should only one trigger
CREATE TRIGGER renderTrigger AFTER INSERT ON chartDataAtomic
BEGIN
  insert into tick (timestep) values (null);
END;

CREATE TRIGGER deltaTrigger AFTER INSERT ON deltaItx
BEGIN
  insert into itxId_SP (itxId, ts, itxType)
    select itxId, timeNow(), 'delta'
    from focusItx;
  insert into tick (timestep) values (null);
END;
