import { query, close } from "../db.js";
import { output } from "../output.js";

export async function allContentSourcesUsage(opts) {
  const rows = await query(`SELECT * FROM (
    SELECT
      featureName,
      contentService,
      COUNT(DISTINCT pageOrTemplateId) as countOfPagesOrTemplatesUsing
    FROM view_rendering
    INNER JOIN view_page_and_template ON view_page_and_template.published = view_rendering.renderingVersionId
      AND contentService != ''
    WHERE pageOrTemplateId IS NOT NULL
    GROUP BY contentService, featureName
  ) ORDER BY countOfPagesOrTemplatesUsing DESC`);
  output(rows, opts, "Content sources in feature configuration in pages and templates");
  close();
}
