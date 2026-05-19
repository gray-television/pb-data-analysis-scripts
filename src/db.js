import duckdb from "duckdb";
import path from "path";
import { config } from "./cli.js";

const DB_PATH = path.resolve(config.dbPath);

let db = null;
let conn = null;

export function getConnection() {
  if (!conn) {
    db = new duckdb.Database(DB_PATH);
    conn = db.connect();
  }
  return conn;
}

export function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    getConnection().all(sql, ...params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

export function run(sql) {
  return new Promise((resolve, reject) => {
    getConnection().run(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export function close() {
  if (db) db.close();
  db = null;
  conn = null;
}
