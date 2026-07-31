import { query, close } from "../db.js";
import { output } from "../output.js";

export async function findFeaturesByCustomField(key, value, opts) {
  const negate = value.startsWith('!');
  const matchValue = negate ? value.slice(1) : value;
  const filter = negate
    ? `(json_extract_string(customFields, '$.${key}') IS NULL OR json_extract_string(customFields, '$.${key}') != ?)`
    : `json_extract_string(customFields, '$.${key}') = ?`;
  const features = opts.f ? opts.f.split(',').map(s => s.trim()) : null;
  const featureFilter = features
    ? `AND af.featureName IN (${features.map(() => '?').join(', ')})`
    : '';
  const params = features ? [matchValue, ...features] : [matchValue];
  const rows = await query(`
    WITH PublishedRenderings AS (
      SELECT DISTINCT headRendering as renderingId
      FROM view_page_and_template
      WHERE headRendering IS NOT NULL
    ),
    PublishedLayoutItems AS (
      SELECT _id as renderingId, _version as renderingVersionId, layout, layoutItems
      FROM read_json_auto('pb-data/rendering.json', format='newline_delimited', ignore_errors=true)
      WHERE _id IN (SELECT renderingId FROM PublishedRenderings)
    ),
    FlattenedLayoutItems AS (
      SELECT renderingVersionId, layout, unnest(layoutItems) as layoutItem
      FROM PublishedLayoutItems
    ),
    Flattened AS (
      SELECT renderingVersionId, layout, unnest(layoutItem.renderableItems) as item
      FROM FlattenedLayoutItems
    ),
    TopLevel AS (
      SELECT renderingVersionId, layout, item.featureConfig as featureName, item.displayName as featureDisplayName, CAST(item.customFields AS JSON) as customFields
      FROM Flattened WHERE item.className LIKE '%.rendering.Feature'
    ),
    FromChains AS (
      SELECT renderingVersionId, layout, f.featureConfig as featureName, f.displayName as featureDisplayName, CAST(f.customFields AS JSON) as customFields
      FROM Flattened, unnest(item.features) as t(f)
      WHERE item.className LIKE '%.rendering.Chain'
    ),
    AllFeatures AS (
      SELECT * FROM TopLevel
      UNION ALL
      SELECT * FROM FromChains
    )
    SELECT
      pt.pageOrTemplateId, pt.isPageOrTemplate, pt.uri, pt.name,
      af.featureName, af.featureDisplayName,
      json_extract_string(af.customFields, '$.${key}') as ${key}
    FROM AllFeatures af
    LEFT JOIN view_page_and_template pt ON pt.published = af.renderingVersionId
    WHERE json_valid(CAST(af.customFields AS VARCHAR))
      AND ${filter}
      ${featureFilter}
      AND af.featureName != ''
      AND af.renderingVersionId IS NOT NULL
    ORDER BY pt.isPageOrTemplate ASC, pt.pageOrTemplateId ASC, pt.uri ASC, pt.name ASC
  `, params);
  output(rows, opts, `Features with customFields.${key} = ${value}`);
  close();
}
