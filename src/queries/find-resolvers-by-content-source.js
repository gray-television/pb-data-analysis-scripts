import { query, close } from "../db.js";
import { output } from "../output.js";

export async function findResolversByContentSource(name, opts) {
  const rows = await query(`SELECT
    _id, priority, name, pattern,
    contentConfigMapping, content2pageMapping, defaultOutputType, note
  FROM view_resolver
  WHERE contentSourceId = ?
  ORDER BY priority ASC, name ASC`, [name]);
  output(rows, opts, `All resolvers using content source: ${name}`);
  close();
}
