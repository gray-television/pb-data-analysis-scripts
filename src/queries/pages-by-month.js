import { query, close } from "../db.js";
import { output } from "../output.js";

export async function pagesByMonth(opts) {
  const rows = await query(`
    WITH EarliestPerPage AS (
      SELECT
        r._pt as pageId,
        MIN(CAST(r.creationDate AS BIGINT)) as firstCreatedMs
      FROM read_json_auto('pb-data/rendering.json', format='newline_delimited', ignore_errors=true) r
      INNER JOIN view_page_and_template p ON p.pageOrTemplateId = r._pt
      WHERE p.isPageOrTemplate = 'Page'
      GROUP BY r._pt
    )
    SELECT
      STRFTIME(epoch_ms(firstCreatedMs), '%Y-%m') AS month,
      COUNT(*) AS pages_created
    FROM EarliestPerPage
    WHERE YEAR(epoch_ms(firstCreatedMs)) >= 2019
    GROUP BY month
    ORDER BY month
  `);

  output(rows, { ...opts, csv: true }, "Pages created by month");
  close();
}
