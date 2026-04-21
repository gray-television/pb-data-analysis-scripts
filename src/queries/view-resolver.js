import { query, close } from "../db.js";
import { output } from "../output.js";

export async function viewResolver(opts) {
  const rows = await query(`SELECT * FROM view_resolver ORDER BY priority ASC, name ASC`);
  output(rows, opts, "Select all from view_resolver");
  close();
}
