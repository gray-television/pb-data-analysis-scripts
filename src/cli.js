import "dotenv/config";

export const config = {
  pbDataDir: process.env.PB_DATA_DIR || "pb-data",
  dbPath: process.env.DB_PATH || "_tmpview.db",
  outputDir: process.env.OUTPUT_DIR || "output",
};

export function parseCliArgs(rawArgs) {
  const [, , ...args] = rawArgs;
  const _parseKey = (key) => {
    if (key.startsWith("--")) return key.substring(2).trim();
    if (key.startsWith("-")) return key.substring(1).trim();
    return key.trim();
  };
  const _parseValue = (value) => {
    if (typeof value === "undefined") return true;
    const val = (value || "").toString().trim();
    if (val === "true") return true;
    if (val === "false") return false;
    return val;
  };
  return args.reduce((acc, el) => {
    const [originalKey, originalValue] = el.split("=");
    acc[_parseKey(originalKey)] = _parseValue(originalValue);
    return acc;
  }, {});
}
