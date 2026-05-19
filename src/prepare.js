import fs from "fs";
import path from "path";
import { BSON } from "bson";
import chalk from "chalk";
import duckdb from "duckdb";
import { fileURLToPath } from "url";
import { config } from "./cli.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PB_DATA_DIR = path.resolve(config.pbDataDir);
const DB_PATH = path.resolve(config.dbPath);
const VIEWS_SQL = path.resolve(__dirname, "views.sql");

function convertBsonToJsonl(bsonPath, jsonlPath) {
  const data = fs.readFileSync(bsonPath);
  const out = fs.createWriteStream(jsonlPath);
  let offset = 0;
  let count = 0;
  while (offset < data.length) {
    const docSize = data.readInt32LE(offset);
    if (docSize <= 0 || offset + docSize > data.length) break;
    const docBuf = data.subarray(offset, offset + docSize);
    try {
      const doc = BSON.deserialize(docBuf, { promoteValues: true });
      out.write(JSON.stringify(doc) + "\n");
      count++;
    } catch {
      // skip malformed docs
    }
    offset += docSize;
  }
  out.end();
  return count;
}

async function main() {
  if (!fs.existsSync(PB_DATA_DIR)) {
    console.error("Error: pb-data/ folder not found. Place your pb-data in the project root.");
    process.exit(1);
  }

  console.log(chalk.yellow("\n--- Cleaning previous data ---\n"));
  const oldJsonl = fs.readdirSync(PB_DATA_DIR).filter((f) => f.endsWith(".json") && !f.endsWith(".metadata.json"));
  for (const file of oldJsonl) {
    fs.unlinkSync(path.join(PB_DATA_DIR, file));
  }
  if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);
  for (const ext of [".wal", ".tmp"]) {
    const lockFile = DB_PATH + ext;
    if (fs.existsSync(lockFile)) fs.unlinkSync(lockFile);
  }

  console.log(chalk.yellow("--- Convert bson files to jsonl files ---\n"));
  const bsonFiles = fs.readdirSync(PB_DATA_DIR).filter((f) => f.endsWith(".bson"));
  for (const file of bsonFiles) {
    const base = path.basename(file, ".bson");
    const count = convertBsonToJsonl(
      path.join(PB_DATA_DIR, file),
      path.join(PB_DATA_DIR, `${base}.json`)
    );
    console.log(`  ${base}: ${count} objects`);
  }

  console.log(chalk.yellow("--- Create DuckDB database with views ---\n"));
  const viewsSql = fs.readFileSync(VIEWS_SQL, "utf-8");

  await new Promise((resolve, reject) => {
    const db = new duckdb.Database(DB_PATH);
    const conn = db.connect();
    conn.exec(viewsSql, (err) => {
      db.close();
      if (err) reject(err);
      else resolve();
    });
  });

  console.log("DONE");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
