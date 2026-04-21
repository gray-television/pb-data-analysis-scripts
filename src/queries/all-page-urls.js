import { query, close } from "../db.js";
import { output } from "../output.js";

export async function allPageUrls(opts) {
  const rows = await query(`SELECT pageOrTemplateId, uri, name, published
    FROM view_page_and_template
    WHERE isPageOrTemplate = 'Page' AND published IS NOT NULL
    ORDER BY uri ASC`);
  output(rows, opts, "All published pages");
  close();
}
