import { diel } from "./setup";
import { assertQueryHasResult } from "../lib/dbHelper";

// the input should already be from a group_concat
// they can just specify the remote
// to add the string properly I would need some AST representation for the query definition...
// just going to add quotes to EVERYTHING, since sqlite seems to do the cohersion properly from string to numbers anyways...
export function generateSQLForTableCopy(sharedTable: string, shareQuery: string) {
  let tableRes = diel.exec(shareQuery)[0];
  assertQueryHasResult(tableRes, "currentItx");
  // FIXME: have more robust typing here...
  // need to make null explicit here...
  // selection needs to have a quote around it...
  const values = tableRes.values.map((d: any[]) => `(${d.map((v: any) => (v === null) ? "null" : `'${v}'`).join(", ")})`);
  let shareSql = `
    DELETE from ${sharedTable};
    INSERT INTO ${sharedTable} VALUES ${values};`;
  return shareSql;
}


export function dW(sql: string) {
  diel.worker.postMessage({
    id: "print",
    action: "exec",
    sql
  });
}
(<any>window).dW = dW;