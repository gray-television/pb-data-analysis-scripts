import { query, close } from "../db.js";
import { outputDescribe } from "../output.js";

export async function describePageOrTemplate(id, opts) {
  const meta = await query(`SELECT * FROM view_page_and_template WHERE pageOrTemplateId = ?`, [id]);

  const chains = await query(`SELECT * FROM (
    SELECT chainName, COUNT(DISTINCT featureName) as countOfTimesUsed
    FROM view_rendering
    INNER JOIN view_page_and_template ON view_page_and_template.published = view_rendering.renderingVersionId
      AND view_page_and_template.pageOrTemplateId = ?
    WHERE chainName != ''
    GROUP BY chainName
  ) ORDER BY chainName ASC`, [id]);

  const features = await query(`SELECT * FROM (
    SELECT featureName,
      COUNT(DISTINCT CONCAT(COALESCE(chainName, ''), '|', layout, '|', COALESCE(contentService, ''))) as countOfTimesUsed
    FROM view_rendering
    INNER JOIN view_page_and_template ON view_page_and_template.published = view_rendering.renderingVersionId
      AND view_page_and_template.pageOrTemplateId = ?
    WHERE featureName != ''
    GROUP BY featureName
  ) ORDER BY featureName ASC`, [id]);

  const contentSources = await query(`SELECT * FROM (
    SELECT featureName, contentService,
      COUNT(DISTINCT CONCAT(COALESCE(chainName, ''), '|', layout)) as countOfTimesUsed
    FROM view_rendering
    INNER JOIN view_page_and_template ON view_page_and_template.published = view_rendering.renderingVersionId
      AND view_page_and_template.pageOrTemplateId = ?
    WHERE contentService != '' AND featureName != ''
    GROUP BY contentService, featureName
  ) ORDER BY featureName ASC`, [id]);

  outputDescribe({ meta, chains, features, contentSources }, opts);
  close();
}
