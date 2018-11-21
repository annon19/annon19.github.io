// import * as sql from "sql.js";
// import * as fs from "fs";

// // import { downloadHelper } from "../records/setup";

// // load a db
// // add udf and evoke it later
// function timeNow() {
//   return +new Date();
// }

// function save() {
//   let db = new sql.Database();
//   // create the dbs
//   db.run(`create table t1 as select 1 as a;`);
//   db.create_function("timeNow", timeNow);
//   let res2 = db.exec(`select timeNow()`);
//   console.log(`res2, ${res2[0].values[0][0]}`);
//   let dRaw = db.export();
//   let blob = new Buffer(dRaw);
//   fs.writeFileSync("test.db", blob);
// }

// function load() {
//   const filebuffer = fs.readFileSync("test.db");
//   const db = new sql.Database(filebuffer);
//   db.exec("insert into t1 values (2), (3);");
//   db.create_function("timeNow", timeNow);
//   let res = db.exec(`select * from t1`);
//   console.log(`res, ${res[0].values[0][0]}`);
//   let res2 = db.exec(`select timeNow()`);
//   console.log(`res2, ${res2[0].values[0][0]}`);
// }

// function objectFeature() {
//   // Create a database
//   let db = new sql.Database();
//   // NOTE: You can also use new sql.Database(data) where
//   // data is an Uint8Array representing an SQLite database file

//   // Execute some sql
//   let sqlstr = "CREATE TABLE hello (a int, b char);";
//   sqlstr += "INSERT INTO hello VALUES (0, 'hello');";
//   sqlstr += "INSERT INTO hello VALUES (1, 'world');";
//   db.run(sqlstr); // Run the query without returning anything

//   let res = db.exec("SELECT * FROM hello");
//   // Prepare an sql statement
//   let stmt = db.prepare("SELECT * FROM hello WHERE a=:aval AND b=:bval");

//   // Bind values to the parameters and fetch the results of the query
//   let result = stmt.getAsObject({":aval" : 1, ":bval" : "world"});
//   console.log(result); // Will print {a:1, b:'world'}
// }


// // save();
// // load();
// objectFeature();