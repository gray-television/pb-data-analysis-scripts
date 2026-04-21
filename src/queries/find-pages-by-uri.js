import { query, close } from "../db.js";
import { output } from "../output.js";

export async function findPagesByUri(uri, opts) {
  const rows = await query(`SELECT * FROM view_page_and_template
    WHERE uri LIKE '%' || ? || '%'
    ORDER BY isPageOrTemplate ASC, uri ASC, name ASC`, [uri]);
  output(rows, opts, `All published pages with URI contains: ${uri}`);
  close();
}
