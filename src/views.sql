-- Resolver view
CREATE VIEW view_resolver AS
SELECT
  _id,
  params,
  sites,
  testUri,
  name,
  CAST(json_extract(to_json(priority), '$.$numberInt') AS INTEGER) as priority,
  pattern,
  page,
  contentSourceId,
  contentConfigMapping,
  content2pageMapping,
  CAST(json_extract(to_json(__v), '$.$numberInt') AS INTEGER) as __v,
  defaultOutputType,
  REPLACE(REPLACE(note, CHR(10), ' '), CHR(13), ' ') as note -- replace newlines with spaces
FROM read_json_auto(
  'pb-data/resolver_config.json',
  format = 'newline_delimited',
  ignore_errors=true
);

-- Pages and templates combined view
--
-- CHANGE: Added headRendering column extracted from versions.{publishedVersionId}.head
-- This is the actual published rendering ID. The page/template `published` field only
-- contains the version ID, not the rendering ID.
--
-- Original:
--   SELECT _id as pageOrTemplateId, 'Page' as isPageOrTemplate, uri, name,
--     defaultOutputType, published
--   FROM read_json_auto('pb-data/page.json', ...)
--
CREATE VIEW view_page_and_template AS
SELECT
  _id as pageOrTemplateId,
  'Page' as isPageOrTemplate,
  uri,
  name,
  defaultOutputType,
  published,
  json_extract_string(versions, '$.' || published || '.head') as headRendering
FROM read_json_auto(
  'pb-data/page.json',
  format = 'newline_delimited',
  ignore_errors=true
)
UNION
SELECT
  _id as pageOrTemplateId,
  'Template' as isPageOrTemplate,
  '' as uri,
  name,
  '' as defaultOutputType,
  published,
  json_extract_string(versions, '$.' || published || '.head') as headRendering
FROM read_json_auto(
  'pb-data/template.json',
  format = 'newline_delimited',
  ignore_errors=true
);

-- Simplified and flattened rendering collection view
CREATE VIEW view_rendering AS
--
-- CHANGE: Replaced version-based filtering + creationDate guessing with direct
-- rendering ID match using the `head` field from page/template versions.
--
-- Original PublishedVersions CTE:
--   WITH PublishedVersions AS (
--     SELECT DISTINCT published as versionId
--     FROM view_page_and_template
--     WHERE published IS NOT NULL
--   ),
--
-- Original PublishedLayoutItems filter:
--   WHERE _version IN (SELECT versionId FROM PublishedVersions)
--
-- Original LatestLayoutItems selection (guessed by creationDate):
--   QUALIFY ROW_NUMBER() OVER (PARTITION BY renderingVersionId ORDER BY creationDate DESC) = 1
--
-- Problem: Multiple renderings share the same _version. The oldest is the published
-- snapshot, newer ones are draft autosaves. Sorting by creationDate (ASC or DESC)
-- does not reliably identify the published rendering.
--
-- Fix: The page/template JSON contains versions.{versionId}.head which is the
-- definitive published rendering _id. We now filter renderings by matching _id
-- directly against headRendering, eliminating all guesswork.
--
WITH PublishedRenderings AS (
  SELECT DISTINCT headRendering as renderingId
  FROM view_page_and_template
  WHERE headRendering IS NOT NULL
),
PublishedLayoutItems AS (
  SELECT
    _id as renderingId,
    _version as renderingVersionId,
    json_extract_string(creationDate, '$.$numberLong') as creationDate,
    layout,
    layoutItems
  FROM read_json_auto(
    'pb-data/rendering.json',
    format = 'newline_delimited',
    ignore_errors=true
  )
  WHERE _id IN (SELECT renderingId FROM PublishedRenderings)
),
-- Original LatestLayoutItems CTE (removed — no longer needed):
--   LatestLayoutItems AS (
--     SELECT renderingId, renderingVersionId, creationDate, layout, layoutItems
--     FROM PublishedLayoutItems
--     QUALIFY ROW_NUMBER() OVER (PARTITION BY renderingVersionId ORDER BY creationDate ASC) = 1
--     ORDER BY renderingVersionId, creationDate DESC
--   ),
FlattenedLayoutItems AS (
  SELECT
    renderingId,
    renderingVersionId,
    creationDate,
    layout,
    unnest(layoutItems) as layoutItem
  FROM PublishedLayoutItems
),
RenderableItems AS (
  SELECT
    renderingId,
    renderingVersionId,
    creationDate,
    layout,
    unnest(layoutItem.renderableItems) as renderableItem
  FROM FlattenedLayoutItems
),
ExpandedRenderableItems AS (
  SELECT
    renderingVersionId,
    layout,
    renderableItem.fingerprint,
    renderableItem.className,
    renderableItem.featureConfig,
    renderableItem.chainConfig,
    renderableItem.displayName,
    renderableItem.customFields,
    renderableItem.features
  FROM RenderableItems
),
FeaturesFromRenderableItems AS (
  SELECT
    renderingVersionId,
    layout,
    fingerprint,
    '' as chainName,
    '' as chainDisplayName,
    featureConfig as featureName,
    displayName as featureDisplayName,
    (
      SELECT string_agg(content_service, '|')
      FROM (
        SELECT DISTINCT json_extract_string(customFields, '$.' || k || '.contentService') as content_service
        FROM unnest(json_keys(customFields)) as t(k)
        WHERE json_extract_string(customFields, '$.' || k || '.contentService') IS NOT NULL
          AND json_extract_string(customFields, '$.' || k || '.contentService') != ''
      )
    ) as contentService
    FROM ExpandedRenderableItems
    WHERE className LIKE '%.rendering.Feature'
),
ChainsFromRenderableItems AS (
  SELECT
      renderingVersionId,
      layout,
      chainConfig as chainName,
      displayName as chainDisplayName,
      features
    FROM ExpandedRenderableItems
    WHERE className LIKE '%.rendering.Chain'
),
UnnestedFeaturesFromChains AS (
  SELECT
    renderingVersionId,
    layout,
    chainName,
    chainDisplayName,
    unnest(features) as feature
  FROM ChainsFromRenderableItems
),
FeaturesFromChains AS (
  SELECT
    renderingVersionId,
    layout,
    feature.fingerprint,
    chainName,
    chainDisplayName,
    feature.featureConfig as featureName,
    feature.displayName as featureDisplayName,
    (
      SELECT string_agg(content_service, '|')
      FROM (
        SELECT DISTINCT json_extract_string(feature.customFields, '$.' || k || '.contentService') as content_service
        FROM unnest(json_keys(feature.customFields)) as t(k)
        WHERE json_extract_string(feature.customFields, '$.' || k || '.contentService') IS NOT NULL
          AND json_extract_string(feature.customFields, '$.' || k || '.contentService') != ''
      )
    ) as contentService
  FROM UnnestedFeaturesFromChains
),
FlattenedAllFeatures AS (
  SELECT *
  FROM (
    SELECT * FROM FeaturesFromRenderableItems
    UNION ALL
    SELECT * FROM FeaturesFromChains
  )
)
SELECT * FROM FlattenedAllFeatures
