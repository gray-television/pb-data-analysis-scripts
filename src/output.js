import chalk from "chalk";
import fs from "fs";
import path from "path";
import { config } from "./cli.js";

const OUTPUT_DIR = path.resolve(config.outputDir);

function normalize(rows) {
  return rows.map((r) => Object.fromEntries(
    Object.entries(r).map(([k, v]) => [k, typeof v === "bigint" ? Number(v) : v])
  ));
}

function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function buildFilename(command, param, ext) {
  const parts = [command];
  if (param) parts.push(param.replace(/[^a-zA-Z0-9_-]/g, "_"));
  const d = new Date();
  const ts = d.getFullYear()
    + String(d.getMonth() + 1).padStart(2, "0")
    + String(d.getDate()).padStart(2, "0")
    + "T" + String(d.getHours()).padStart(2, "0")
    + String(d.getMinutes()).padStart(2, "0")
    + String(d.getSeconds()).padStart(2, "0");
  parts.push(ts);
  return parts.join("_") + ext;
}

function writeCsv(rows, filepath) {
  if (!rows.length) { fs.writeFileSync(filepath, ""); return; }
  const cols = Object.keys(rows[0]);
  const lines = [cols.join(",")];
  for (const row of rows) {
    lines.push(cols.map((c) => {
      const v = row[c] ?? "";
      const s = String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    }).join(","));
  }
  fs.writeFileSync(filepath, lines.join("\n") + "\n");
}

export function printHeader(text) {
  console.log(chalk.yellow(`\n--- ${text} ---\n`));
}

export function printTable(rows) {
  if (!rows.length) {
    console.log("0 rows");
    return;
  }
  console.table(normalize(rows));
}

export function printJson(data) {
  console.log(JSON.stringify(typeof data === "object" && !Array.isArray(data) ? normalizeDeep(data) : normalize(data), null, 2));
}

function normalizeDeep(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = Array.isArray(v) ? normalize(v) : v;
  }
  return out;
}

export function output(rows, opts, header) {
  printHeader(header);
  printTable(rows);
  if (opts.json) {
    ensureOutputDir();
    const file = path.join(OUTPUT_DIR, buildFilename(opts._command, opts._param, ".json"));
    fs.writeFileSync(file, JSON.stringify(normalize(rows), null, 2) + "\n");
    console.log(`\nSaved ${file}`);
  }
  if (opts.csv) {
    ensureOutputDir();
    const file = path.join(OUTPUT_DIR, buildFilename(opts._command, opts._param, ".csv"));
    writeCsv(normalize(rows), file);
    console.log(`\nSaved ${file}`);
  }
}

export function outputDescribe(data, opts) {
  for (const [key, rows] of Object.entries(data)) {
    printHeader(key);
    printTable(rows);
  }
  if (opts.json) {
    ensureOutputDir();
    const file = path.join(OUTPUT_DIR, buildFilename(opts._command, opts._param, ".json"));
    fs.writeFileSync(file, JSON.stringify(normalizeDeep(data), null, 2) + "\n");
    console.log(`\nSaved ${file}`);
  }
  if (opts.csv) {
    ensureOutputDir();
    for (const [key, rows] of Object.entries(data)) {
      const file = path.join(OUTPUT_DIR, buildFilename(`${opts._command}_${key}`, opts._param, ".csv"));
      writeCsv(normalize(rows), file);
      console.log(`Saved ${file}`);
    }
  }
}
