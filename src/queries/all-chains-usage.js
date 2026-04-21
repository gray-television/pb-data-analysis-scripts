import { query, close } from "../db.js";
import { output } from "../output.js";

export async function allChainsUsage(opts) {
  const rows = await query(`SELECT * FROM (
    SELECT
      chainName,
      COUNT(1) as countOfTimesUsed,
      COUNT(DISTINCT pageOrTemplateId) as countOfPagesOrTemplatesUsing
    FROM view_rendering
    LEFT JOIN view_page_and_template ON view_page_and_template.published = view_rendering.renderingVersionId
    WHERE pageOrTemplateId IS NOT NULL AND chainName != ''
    GROUP BY chainName
  ) ORDER BY countOfPagesOrTemplatesUsing DESC`);
  output(rows, opts, "All chains used in published pages, sorted by most used first");
  close();
}
