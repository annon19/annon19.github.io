import { Database, Statement } from "sql.js";

import { loadPage } from "..";
import { hashCompare, timeNow, log, downloadHelper } from "../lib/dbHelper";
import { generateSQLForTableCopy } from "./dielHelper";
import { setUpWorker } from "./workerSetup";

const FilePathPrefix = "/dist/";
type ReactFunc = (v: any) => void;
const charts = ["day", "carrier", "delays", "state"];

const DBFile = {
  training: {
    main: `${FilePathPrefix}main_training.db`,
    worker: `${FilePathPrefix}worker_training.db`
  },
  task: {
    main: `${FilePathPrefix}main_task.db`,
    worker: `${FilePathPrefix}worker_task.db`
  }
};

// diel should generate this as well.
export type XBrushItxInputType = {$chart: string, $low?: number, $high?: number, $low2?: number, $high2?: number, $selection?: string};
export type NavigateItxInputType = {$xFilterItxId: number};
export type DeltaItxInputType = {$val: number};
type EventLogType = {$eventName: string, $parameter?: any};
type ThumbnailType = {$itxId: number, $img: string};
type AllInputType = XBrushItxInputType
                   | NavigateItxInputType
                   | DeltaItxInputType
                   | EventLogType
                   | TaskTimesType;
type OutputConfig = {
  singleRow?: boolean,
  notNull?: boolean,
  parameters?: any
};
type TickBind = {view: string, s: Statement, f: ReactFunc, c: OutputConfig};
type TaskInfoType = {$qId: string, $taskType: string, $isTraining: number};
type MemoryTaskType = {$qId: string, $linkedQId: string};
type TaskTimesType = {$qId: string, $eventType: string};
type AnswersType = {$qId: string, $answer: string, $confidence: string, $score: number, $comment: string};

const defaultOuptConfig = {singleRow: false, notNull: false};

export default class Diel {
  // public
  Input: {
    xBrushItx: (i: XBrushItxInputType) => void;
    navigateItx: (i: NavigateItxInputType) => void;
    deltaItx: (i: DeltaItxInputType) => void;
    deleteItx: () => void;
  };

  LogData: {
    thumbnail: (i: ThumbnailType) => void;
    eventLog: (i: EventLogType) => void;
    taskInfo: (i: TaskInfoType) => void;
    memoryTask: (i: MemoryTaskType) => void;
    taskTimes: (i: TaskTimesType) => void;
    answers: (i: AnswersType) => void;
  };
  static readonly ItxLogsViews = [
    // state programs
    "itxId_SP", "brushState_SP", "brushDep_SP",
    "eqChart_SP", "chartDataAtomic",
    "eventLog",
    "thumbnail",
    // interactions
    "navigateItx", "deltaItx", "deleteItx",
    "xBrushItx"
  ];

  // these will only be deleted when the training switches to task
  // so each time this is sent to ClearHistory, it's not cleared
  // no need to be removed since the entire DB will be dropped
  static readonly TaskLogsViews = [
    // task info
    "memoryTask", "taskTimes", "answers", "taskInfo",
  ];

  // private
  private db: Database;
  private buffer: Uint8Array;
  private input: {
    xBrushItx: Statement,
    navigateItx: Statement,
    deltaItx: Statement,
    deleteItx: Statement,
  };
  private logData: {
    thumbnail: Statement,
    thumbnailRemove: Statement,
    eventLog: Statement,
    taskInfo: Statement,
    memoryTask: Statement,
    taskTimes: Statement,
    answers: Statement,
  };
  private output: Map<string, Statement>;
  // private chronOutput: Map<string, Statement>;
  private logs: Map<string, Statement>;
  private activeRequests: {id: string, ts: number}[];
  deadRequests: {id: string, ts: number}[];
  staticViews: Map<string, Statement>;
  boundFns: TickBind[];
  frozen: boolean;
  frozenBind: (control: boolean) => void; // this is a bit messy
  worker: Worker;
  workerLoaded: boolean;
  stateRefresh: () => void;

  // public methods
  constructor() {
    console.log("Diel initializing for training");
    this.LoadAll(DBFile.training.main, DBFile.training.worker, true);
    this.worker = new Worker(`./dist/worker.sql.js`);
    this.boundFns = [];
    this.workerLoaded = false;
    this.activeRequests = [];
  }

  // has to be done at run time since the react functions need to be constructed.
  BindOutput(view: string, reactFn: ReactFunc, cIn = {} as OutputConfig) {
    // console.log("config", cIn, view);
    if (!this.output.has(view)) {
      throw new Error(`output not defined ${view} ${Array.from(this.output.keys()).join(", ")}`);
    }
    // immtable assign...
    const c = Object.assign({}, defaultOuptConfig, cIn);
    // console.log("final config", c);
    if (view.startsWith("chron") && !cIn.parameters) throw new Error("chron must have params");
    this.boundFns.push({view, s: this.output.get(view), f: reactFn, c });
  }

  // SetStateRefresh(f: () => void) {
  //   this.stateRefresh = f;
  // }

  GetLogs(view: string) {
    const s = this.logs.get(view);
    if (!s) {
      console.log(`${view} not found in diel logs`, this.logs);
      throw new Error(`${view} not found in diel logs`);
    }
    s.bind({});
    let r = [];
    while (s.step()) {
      r.push(s.getAsObject());
    }
    return r;
  }

  GetStaticView(view: string) {
    const s = this.staticViews.get(view);
    s.bind({});
    let r = [];
    while (s.step()) {
      r.push(s.getAsObject());
    }
    if (r.length === 0) {
      throw new Error(`Static view ${view} should not be empty`);
    }
    return r;
  }

  LoadAll = async (mainFile: string, workerFile: string, shouldLoadPage: boolean) => {
    console.log("diel Load", mainFile, workerFile);
    await this.loadMain(mainFile);
    await this.loadWorker(workerFile);
    setUpWorker(this.worker);
    // populates all the prepared statements
    this.setup();
    // calls react
    // if diel has been set up already
    // we need to retarget all the binds
    // basically find all the view names
    if (this.boundFns.length > 0) {
      this.boundFns.map(f => {
        f.s = this.output.get(f.view);
      });
    }
    this.deadRequests = [];
    this.activeRequests = [];
    shouldLoadPage ? loadPage() : null;
    // forcing a tick here to refresh
    // this.Input.xBrushItx({$chart: "day"});
  }

  SetFreeze(v: boolean) {
    this.frozen = v;
    this.frozenBind(!v);
  }

  // hmm, this is not a bad pattern
  // avoids the jumping around
  BindFreeze(f: (control: boolean) => void) {
    this.frozenBind = f;
  }

  loadMain = async (mainFile: string) => {
    // if the current db is not null, close it
    if (this.db) {
      this.db.close();
    }
    const response = await fetch(mainFile);
    const bufferRaw = await response.arrayBuffer();
    this.buffer = new Uint8Array(bufferRaw);
    this.db = new Database(this.buffer);
  }

  loadWorker = async (file: string) => {
    // first close then open
    // based on the source code
    // they already seem to be closing the db
    // https://github.com/kripken/sql.js/blob/master/coffee/worker.coffee
    const response = await fetch(file);
    const bufferRaw = await response.arrayBuffer();
    const buffer = new Uint8Array(bufferRaw);
    this.worker.postMessage({
      id: "opened",
      action: "open",
      buffer,
    });
    this.workerLoaded = true;
  }

  /**
   * @all: problematic to delete since there might be memory tasks with dependencies
   */
  ClearHistory() {
    // must be more recent that 10 seconds ago, as GC
    this.deadRequests = this.deadRequests.concat(this.activeRequests).filter(r => r.ts > Date.now() - 10000);
    // console.log("timeouts right now", this.deadRequests);
    const tablesWithoutItxId = [
      // non reactive state
      "eqChart_SP",
      "eventLog",
      // interactions whose itxId are different from those of the brushes
      "navigateItx", "deltaItx", "deleteItx"
    ];
    tablesWithoutItxId.map(t => this.db.run(`delete from ${t}`));
    const tablesWithItxId = [
      // itx state programs
      "itxId_SP", "brushState_SP", "brushDep_SP", "dataParamHashes_SP",
      // data state programs
      "stateChartData", "dayChartData", "carrierChartData",
      "delaysChartData", "chartDataAtomic",
      // brush has to be the last one due to foreign key issues
      "xBrushItx",
    ];
    tablesWithItxId.map(t => {
      // console.log("delteing", t);
      this.db.run(`delete from ${t} where itxId > 4`);
    });
    // force refresh; must via sql
    this.db.run(`insert into tick (timestep) values (null);`);
    // this.tick()();
  }

  processInput(s: Statement, i: AllInputType) {
    if (this.frozen) {
      return;
    }
    let tsI = Object.assign({$ts: timeNow()}, i);
    s.run(tsI);
  }

  // the rest are private functions
  setup() {
    let db = this.db;
    db.run("PRAGMA foreign_keys = ON;");
    // must do this manually because bundling minimizes the function names...
    db.create_function("tick", this.tick());
    db.create_function("workerGetChartDataView", this.workerGetChartDataView());
    db.create_function("workerShareItx", this.workerShareItx());
    db.create_function("timeNow", timeNow);
    db.create_function("log", log);
    db.create_function("hashCompare", hashCompare);
    this.input = {
      xBrushItx: db.prepare(`
        insert into xBrushItx (ts, chart, low, high, low2, high2, selection)
        values ($ts, $chart, $low, $high, $low2, $high2, $selection)`),
      navigateItx: db.prepare(`
        insert into navigateItx (ts, xFilterItxId)
        values ($ts, $xFilterItxId)`),
      deltaItx: db.prepare(`
        insert into deltaItx (ts, val)
        values ($ts, $val)`),
      deleteItx: db.prepare(`
        insert into deleteItx (ts)
        values ($ts)`)
    };
    this.Input = {
      xBrushItx: (i: XBrushItxInputType) => {
        if (i.$low) {
          if (isNaN(i.$high) || isNaN(i.$low) ) {
            throw new Error("number has to be defined");
          }
        }
        this.processInput(this.input.xBrushItx, i);
      },
      navigateItx: (i: NavigateItxInputType) => {
        this.processInput(this.input.navigateItx, i);
      },
      deltaItx: (i: DeltaItxInputType) => {
        this.processInput(this.input.deltaItx, i);
      },
      deleteItx: () => {
        this.input.deleteItx.run({$ts: timeNow()});
      }
    };
    this.logData = {
      thumbnail: db.prepare(`
        insert into thumbnail (ts, itxId, img)
        values ($ts, $itxId, $img);
      `),
      thumbnailRemove: db.prepare(`
        delete from thumbnail
        where ts < $ts and itxId = $itxId;
      `),
      eventLog: db.prepare(`
        insert into eventLog (ts, eventName, parameter)
        values ($ts, $eventName, $parameter);
      `),
      taskInfo: db.prepare(`
        insert into taskInfo (qId, taskType, isTraining)
        values ($qId, $taskType, $isTraining);
      `),
      taskTimes: db.prepare(`
        insert into taskTimes (ts, qId, eventType)
        values ($ts, $qId, $eventType);
      `),
      answers: db.prepare(`
        insert into answers (qId, answer, confidence, score, comment)
        values ($qId, $answer, $confidence, $score, $comment);
      `),
      memoryTask: db.prepare(`
        insert into memoryTask (qId, linkedQId)
        values ($qId, $linkedQId);
      `)
    };
    // log data should not run process input which has freeze logic
    this.LogData = {
      thumbnail: (i: ThumbnailType) => {
        let tsI = Object.assign({$ts: timeNow()}, i);
        this.logData.thumbnail.run(tsI);
        this.logData.thumbnailRemove.run({$ts: tsI.$ts, $itxId: i.$itxId});
      },
      eventLog: (i: EventLogType) => {
        let tsI = Object.assign({$ts: timeNow()}, i);
        this.logData.eventLog.run(tsI);
      },
      taskInfo: (i: TaskInfoType) => {
        this.logData.taskInfo.run(i);
      },
      taskTimes: (i: TaskTimesType) => {
        let tsI = Object.assign({$ts: timeNow()}, i);
        this.logData.taskTimes.run(tsI);
      },
      answers: (i: AnswersType) => {
        this.logData.answers.run(i);
      },
      memoryTask: (i: MemoryTaskType) => {
        this.logData.memoryTask.run(i);
      },
    };
    this.output = new Map();
    // FIXME: when writing the parser, change this directly into code level
    // since it's actually fixed at compile time
    [
      "ChartSelection", "ChartIsLoading", "ChartDataView"
    ].map(v => {
      charts.map(c => {
        const view = `${c}${v}`;
        this.output.set(view, db.prepare(`select * from ${view}`));
      });
    });
    this.logs = new Map();
    Diel.ItxLogsViews.map(v => this.logs.set(v, db.prepare(`select * from ${v}`)));
    Diel.TaskLogsViews.map(v => this.logs.set(v, db.prepare(`select * from ${v}`)));
    // one off ones
    // ["loadingSummary", "focusItx"].map(v => this.output.set(v, db.prepare(`select * from ${v}`)));
    // needs order
    this.output.set("thumbnail", db.prepare(`select * from thumbnail order by itxId asc`));
    // set output for chronicles
    // this output is parametrized; lets do that in react...
    // this.chronOutput = new Map();
    // sigh the following should be automated
    ["chronDayChartSelection", "chronCarrierChartSelection",
    "chronStateChartSelection", "chronDelaysChartSelection",
    "chronDayChartDataView", "chronStateChartDataView",
    "chronCarrierChartDataView", "chronDelaysChartDataView",
    "chronLoadingStatus", "chronChartTitle"
    ].map(v => {
      this.output.set(v, db.prepare(`select * from ${v} where chronRank=$chronRank`));
    });
          // chronicles related
    ["hasMoreChron"].map(v => this.output.set(v, db.prepare(`select * from ${v}`)));
    // static ones
    this.staticViews = new Map();
    charts.map(c => {
      const view = `${c}ChartInitData`;
      this.staticViews.set(view, db.prepare(`select * from ${view}`));
    });
  }

  // tick is invoked inside sql (though it can be invoked here sort of as well)
  tick() {
    const boundFns = this.boundFns;
    const runOutput = this.runOutput;
    return () => {
      // console.log("ticked!", boundFns);
      // const tictime = performance.now();
      boundFns.map(b => {
        runOutput(b);
      });
      // console.log("tick took\t\t", Math.round(performance.now() - tictime));
    };
  }

  Sanity() {
    // does some basic sanity check to help developer against dumb mistakes
    // TODO: first is to make sure that all output views are actually bound to something.
  }

  // temp hack
  IsDuringTask() {
    // console.log(d(`select * from taskTimes`));
    const r = this.db.exec(`select count(*) from taskTimes`);
    return {
      firstTime: r[0].values[0][0] as number === 1,
      duringTask: (r[0].values[0][0] as number % 2) === 1
    };
  }

  exec(sql: string) {
    // these should be internal DIEL use
    // e.g., worker code should also be internal
    // console.log("DIEL exec", sql);
    return this.db.exec(sql);
  }

  workerShareItx() {
    const worker = this.worker;
    return () => {
      // we are going to share currentItx
      // a bit hard coded; need to think about the IR for moving tables around
      const filterQuery = `SELECT * FROM currentItx`;
      const shareSql = generateSQLForTableCopy("currentItx", filterQuery);
      worker.postMessage({
        id: `updateCurrentItx`,
        action: "exec",
        sql: shareSql
      });
    };
  }

  workerGetChartDataView() {
    const worker = this.worker;
    return (itxId: number, chart: string) => {
      const hash = `${timeNow()}-${itxId}=${chart}`;
      this.activeRequests.push({id: hash, ts: Date.now()});
      worker.postMessage({
        id: `share:${itxId}:${chart}:${hash}`,
        action: "exec",
        sql: `SELECT * FROM ${chart}ChartDataView;`
      });
    };
  }

  // only because sql.js does not support user defined aggregates right now
  runOutput(b: TickBind) {
    // s: Statement, reactFn: ReactFunc, singleRow: boolean) {
    // takes a statement and a react function
    // console.log("updating view", b.view);
    // const tictime = performance.now();
    let { s, f, c} = b;
    if (c.parameters) {
      s.bind(c.parameters);
    } else {
      s.bind({});
    }
    let r = [];
    while (s.step()) {
      r.push(s.getAsObject());
    }
    if (c.notNull && r.length === 0) {
      throw new Error(`${b.view} should not be null`);
    }
    if (r.length > 0 && c.singleRow) {
      f(r[0]);
    } else {
      f(r);
    }
    // console.log(`${b.view} took\t\t`, Math.round(performance.now() - tictime));
    return;
  }

  ChangeToTask() {
    this.LoadAll(DBFile.task.main, DBFile.task.worker, false);
    console.log("Changed to task DB");
  }

  TrainingZeroCount() {
    // check if the score for answers are ALL zero
    let r = this.db.exec(`select count(*) from answers where score = 0`);
    return r[0].values[0][0] as number;
  }

  downloadDB() {
    // console.log("download session");
    let dRaw = this.db.export();
    let blob = new Blob([dRaw]);
    downloadHelper(blob,  "session");
  }

  downloadWorkerDB() {
    this.worker.postMessage({
      id: "download",
      action: "export",
    });
  }
}