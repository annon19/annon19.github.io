import { QueryResults, Database } from "sql.js";

export function assertQueryHasResult(r: QueryResults, query?: string) {
  if ((!r) || (!r.values)) {
    throw new Error(`Query ${query} has NO result`);
  }
}

// for console debugging
export function d(db: Database, sql: string) {
  let r = db.exec(sql);
  if (r.length > 0) {
    r[0].values.map((v) => {
      v.map((c, i) => {
        if (r[0].columns[i] === "ts") {
          c = new Date(c as number).toDateString();
        }
      });
    });
    console.log(r[0].columns.join("\t"));
    console.log(JSON.stringify(r[0].values).replace(/\],\[/g, "\n").replace("[[", "").replace("]]", "").replace(/,/g, "\t"));
  } else {
    console.log("NO RESULT");
  }
}
(<any>window).d = d;


export function log(msg: string, source: string) {
  console.log(`[${source}] ${msg}`);
  return 1;
}

export function timeNow() {
  return +new Date();
}

// this is needed because the groupby has non deterministic orderings
// and I wasn't able to write a custom reducer
// I suspect this is faster anyways
export function hashCompare(a: string, b: string): number {
  // split by -
  const aVals = a.split("-");
  const bVals = b.split("-");
  for (let i = 0; i < aVals.length; i++) {
    const av = aVals[i];
    const table = av.split(":")[0];
    const bR = bVals.filter(bv => bv.split(":")[0] === table);
    if (bR.length !== 1) {
      console.log("didn't find", table, bVals);
      return 0;
    }
    if (bR[0] !== av) {
      return 0;
    }
  }
  return 1;
}

export function prettyTimeNow() {
  return new Date().toTimeString().substr(0, 8);
}

/**********************
 * Debugging support
 *********************/

export function downloadHelper(blob: Blob, name: string, extension = "db") {
  let a = document.createElement("a");
  a.href = window.URL.createObjectURL(blob);
  a.download = `${name}_${prettyTimeNow()}.${extension}`;
  a.onclick = function() {
    setTimeout(function() {
      window.URL.revokeObjectURL(a.href);
    }, 1500);
  };
  a.click();
}


export function downloadQueryResultAsCSV(db: Database, query: string) {
  let csvContent = "";
  let r = db.exec(query);
  if (r.length && r[0].values) {
    csvContent += r[0].columns.join(",") + "\r\n";
    r[0].values.forEach((rowArray) => {
      let row = rowArray.join(",");
      csvContent += row + "\r\n";
    });
    let b = new Blob([csvContent], {type: "text/plain;charset=UTF-8"});
    downloadHelper(b, "userData.csv");
    console.log("should have downloaded", csvContent);
  } else {
    console.log("NO RESULT");
  }
}