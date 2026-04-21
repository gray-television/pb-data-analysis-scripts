import { query, close } from "../db.js";
import { output } from "../output.js";

export async function findPagesByChainName(name, opts) {
  const rows = await query(`SELECT * FROM view_page_and_template
    WHERE pageOrTemplateId IN (
      SELECT DISTINCT pageOrTemplateId
      FROM view_rendering
      LEFT JOIN view_page_and_template ON view_page_and_template.published = view_rendering.renderingVersionId
      WHERE pageOrTemplateId IS NOT NULL AND chainName = ?
    )
    ORDER BY isPageOrTemplate ASC, pageOrTemplateId ASC, uri ASC, name ASC`, [name]);
  output(rows, opts, `All published pages using chain: ${name}`);
  close();
}
