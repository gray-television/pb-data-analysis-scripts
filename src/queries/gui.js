import { exec } from "child_process";

export function gui() {
  console.log("Opening DuckDB GUI with _tmpview.db database");
  exec("duckdb -ui _tmpview.db", (err) => {
    if (err) console.error("Error: duckdb -ui requires DuckDB v1.1+. Run: brew upgrade duckdb");
  });
}
