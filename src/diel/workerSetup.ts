
import { getLatency } from "../lib/helper";
import { diel } from "./setup";
import { downloadHelper, timeNow } from "../lib/dbHelper";

export enum LatencyOption {
  None,
  Low,
  High
}
const ExperimentLatencyOption = LatencyOption.High;
export function setUpWorker(worker: Worker) {
  worker.onmessage = function(event) {
    diel.exec(`insert into workerCmds values ('${event.data.id}')`);
    const args = event.data.id.split(":");
    const cmd = args[0];
    switch (cmd) {
      case "download": {
        let blob = new Blob([event.data.buffer]);
        downloadHelper(blob, "workerSession");
        break;
      }
      case "share": {
        const itxId = args[1];
        const chart = args[2];
        const hash = args[3];
        let sql: string = "";
        // TODO: deal with pagination later
        if (event.data.results[0] && event.data.results[0].values.length > 0) {
          const values = event.data.results[0].values;
          // TODO: automtically check for type...
          let fn: (r: any) => string;
          if (chart === "day") {
            fn = (r: any) => `(${itxId}, ${r[0]}, ${r[1]})`;
          } else {
            fn = (r: any) => `(${itxId}, '${r[0]}', ${r[1]})`;
          }
          // else if (chart === "delays") {
          //   fn = (r: any) => `(${itxId}, ${r[0]}, ${r[1]}, ${r[2]})`;
          // } else {
          // }
          sql = `INSERT INTO ${chart}ChartData VALUES ${values.map(fn)};`;
        } else {
          console.log("No result for", chart, itxId);
        }
        window.setTimeout(() => {
          if (diel.deadRequests.indexOf(hash) > -1) {
            console.log("expired", itxId, chart);
            return;
          } else {
            // must be here otherwise the time is wrong
            sql += `\nINSERT INTO chartDataAtomic VALUES (${timeNow()}, ${itxId}, '${chart}');`;
            diel.exec(sql);
          }
        }, getLatency(ExperimentLatencyOption));
        break;
      }
      /**
       * helper calls
       */
      case "print": {
        let r = event.data.results;
        if (r && r.length > 0) {
          r[0].values.map((v: any) => {
            v.map((c: any, i: any) => {
              if (r[0].columns[i] === "ts") {
                c = new Date(c as number).toDateString();
              }
            });
          });
          console.log("Printing results");
          console.log(r[0].columns.join("\t"));
          console.log(JSON.stringify(r[0].values).replace(/\],\[/g, "\n").replace("[[", "").replace("]]", "").replace(/,/g, "\t"));
        }
        break;
      }
    }
  };
}