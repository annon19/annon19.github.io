import * as sql from "sql.js";
import * as fs from "fs";
import { IsChronicles } from "../lib/config";

const AllCharts = ["carrier", "day", "state", "delays"];

function notNull(v: any, item: string) {
  if (!v) { throw new Error (`${item} undefined!`); }
}

function isQueryResultsNull(res: sql.QueryResults[]) {
  if (res[0] && res[0].values && res[0].values.length > 0) {
    return false;
  }
  return true;
}
// this is executed by ts-node and shared with the run time via the actual database.
function timeNow() {
  return +new Date();
}

function _writeDB(db: sql.Database, name: string) {
  let dRaw = db.export();
  let blob = new Buffer(dRaw);
  fs.writeFileSync(`./experiment/dist/${name}`, blob);
}

export function executeFile(f: string, db: sql.Database ) {
  const setupSql = fs.readFileSync(`./experiment/src/diel/sql/${f}.sql`, "utf8");
  let scripts = setupSql.split("\n\n");
  scripts.forEach((s, _) => {
    s = s.replace(/^ *--.*$/mg, "");
    // if (i < scripts.length - 1) {
    //   s += ";";
    // }
    // for debugging, easier to split
    console.log("[executing script]\n", s);
    try {
      db.run(s);
    } catch (error) {
      console.log(`[run error] ${error}`);
      throw new Error("query execution error");
    }
  });
}

function wrapExec(db: sql.Database, sql: string) {
  try {
    db.exec(sql);
  } catch (error) {
    console.log(`[exec error] ${error} \nfor query\n ${sql}\n`);
    throw new Error("query execution error");
  }
}

function prep(option: string) {
  /**
   * worker
   */
  const filebuffer = fs.readFileSync(`./experiment/data/turk_${option}.db`);
  const dbWorker = new sql.Database(filebuffer);
  executeFile("workerViews", dbWorker);

  /**
   * main
   */
  let dbMain = new sql.Database();
  dbMain.create_function("timeNow", timeNow);
  ["tables", "views"].map(f => {
    executeFile(f, dbMain);
  });
  if (IsChronicles) {
    executeFile("chron", dbMain);
  }
  AllCharts.map((chart) => {
    const sql = `select * from ${chart}ChartInitDataView;`;
    const res = dbWorker.exec(sql);
    if (isQueryResultsNull(res)) {
      throw new Error("set up data should be present");
    }
    let fn: (r: any, itx?: number) => string;
    // else if (chart === "delays") {
    //   fn = (r: any, itx?: number) => `(${itx ? `${itx}, ` : ""}${r[0]}, ${r[1]}, ${r[2]})`;
    // }
    if (chart === "day" ) {
      fn = (r: any, itx?: number) => `(${itx ? `${itx}, ` : ""}${r[0]}, ${r[1]})`;
    } else {
      fn = (r: any, itx?: number) => `(${itx ? `${itx}, ` : ""}'${r[0]}', ${r[1]})`;
    }
    wrapExec(dbMain, `INSERT INTO ${chart}ChartInitData VALUES ${res[0].values.map((r) => fn(r))}`);
    // a little bit of ugliness here...
    wrapExec(dbMain, `INSERT INTO ${chart}ChartData VALUES ${res[0].values.map((r) => fn(r, 4))}`);
    // gonna do ts as special otherwise
    wrapExec(dbMain, `INSERT INTO chartDataAtomic values (0, 4, '${chart}')`);
  });
  executeFile("triggers", dbMain);
  if (IsChronicles) {
    executeFile("tickChronTrigger", dbMain);
  } else {
    executeFile("tickTrigger", dbMain);
  }

  // also want to copy over whatever view shared from db
  // going to hard code xBrushItx here....
  const getTableDefinition = `
    SELECT sql
    FROM sqlite_master
    WHERE
      type = 'table'
      AND name = 'xBrushItx';
  `;
  const r = dbMain.exec(getTableDefinition);
  notNull((r && r[0].values[0]), "xBrushItx");
  const copyTableSQL = r[0].values[0][0] as string;
  // very ugly oh well
  dbWorker.exec(copyTableSQL.replace("xBrushItx", "currentItx"));

  _writeDB(dbWorker, `worker_${option}.db`);
  _writeDB(dbMain, `main_${option}.db`);
}

prep("task");
prep("training");