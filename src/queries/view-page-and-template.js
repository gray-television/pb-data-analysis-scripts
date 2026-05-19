import { query, close } from "../db.js";
import { output } from "../output.js";

export async function viewPageAndTemplate(opts) {
  const rows = await query(`SELECT * FROM view_page_and_template ORDER BY isPageOrTemplate ASC, uri ASC, name ASC`);
  output(rows, opts, "Select all from view_page_and_template");
  close();
}
