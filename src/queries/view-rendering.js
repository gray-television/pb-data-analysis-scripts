import { query, close } from "../db.js";
import { output } from "../output.js";

export async function viewRendering(opts) {
  const rows = await query(`SELECT * FROM view_rendering`);
  output(rows, opts, "Select all from view_rendering");
  close();
}
