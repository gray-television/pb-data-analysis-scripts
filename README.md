# PB-Data Analysis Scripts (Node.js)

Analyze Arc XP PageBuilder data (pb-data) locally using Node.js and DuckDB. No external CLI tools required — just `npm install` and go.

> This is a Node.js port of the [original shell scripts](https://github.com/arcxp/pb-data-analysis-scripts). The originals are preserved in `shell-scripts/` for reference. See [CONVERSION_RECORD.md](CONVERSION_RECORD.md) for the full mapping.

> **License:** [MIT](LICENSE) — NO WARRANTY, SLA, or SUPPORT.

---

## Requirements

- Node.js 18+

## Setup

1. Clone this repo
2. Download pb-data from **Arc XP Admin > PageBuilder > Developer Tools > PB Data**
3. Untar the download, rename the folder to `pb-data`, and place it in the project root
4. Install and build views:

```bash
npm install
npm run setup
```

`npm run setup` converts `.bson` files to `.jsonl` and creates a local DuckDB database (`_tmpview.db`) with the SQL views all scripts query against.

> Run `npm run setup` again whenever you download fresh pb-data.

---

## Usage

All commands can be run via `npm run <script>`. Pass flags after `--`.

```bash
npm run <script>
npm run <script> -- -c              # CSV output (auto-saved to output/)
npm run <script> -- -j              # JSON output (auto-saved to output/)
```

`npm run` requires `--` before dash-prefixed flags. To avoid this, use `key=value` syntax instead:

```bash
npm run <script>
npm run <script> csv                # CSV output (auto-saved to output/)
npm run <script> json               # JSON output (auto-saved to output/)
```

Or call the CLI directly:

```bash
node src/index.js <command> [key=value ...]
node src/index.js --help
```

---

## Scripts

### Feature Analysis

| Script | Description |
|---|---|
| `npm run all-features` | List all features in published pages/templates with usage counts |
| `npm run find-feature n=<name>` | List pages/templates using a specific feature (exact match) |

```bash
npm run all-features
npm run all-features csv
npm run find-feature n="global/Footer" json
```

### Chain Analysis

| Script | Description |
|---|---|
| `npm run all-chains` | List all chains in published pages/templates with usage counts |
| `npm run find-chain n=<name>` | List pages/templates using a specific chain |

```bash
npm run all-chains
npm run find-chain n=DefaultChain
```

### Content Source Analysis

| Script | Description |
|---|---|
| `npm run all-content-sources` | Content sources from feature configurations |
| `npm run all-resolvers-sources` | Content sources from route resolver configurations |
| `npm run find-content-source n=<name>` | Features using a content source (fuzzy/LIKE match) |
| `npm run find-resolver n=<name>` | Resolvers using a content source (exact match) |

```bash
npm run all-content-sources
npm run find-content-source n=content-api
npm run find-resolver n=content-api
```

### Custom Field Analysis

| Script | Description |
|---|---|
| `npm run find-custom-field k=<key> v=<value>` | Features where a `customFields` key equals a value |
| `npm run find-custom-field k=<key> 'v=!<value>'` | Features where a `customFields` key does NOT equal a value (includes null/absent) |

Optionally filter to specific feature names with `f=<name1>,<name2>`:

```bash
# All features where imageLazyLoad is true
npm run find-custom-field k=imageLazyLoad v=true

# All features where imageLazyLoad is not true (null, absent, false, or other)
npm run find-custom-field k=imageLazyLoad 'v=!true'

# Same, but only for specific features
npm run find-custom-field k=imageLazyLoad 'v=!true' 'f=global/FlexFeatureFeed,global/FlexFeature' csv
```

> **Note:** Values are always compared as strings. `v=true` matches the string `"true"`, not a boolean.

### Page / URL Analysis

| Script | Description |
|---|---|
| `npm run all-pages` | List all published pages with URIs (excludes templates) |
| `npm run find-page u=<uri>` | List pages with URI containing the filter |

```bash
npm run all-pages
npm run find-page u=/events/
```

### Describe a Page or Template

| Script | Description |
|---|---|
| `npm run describe i=<id>` | Show metadata, chains, features, and content sources for a page/template |

```bash
npm run describe i=p9NRAEBz90bytDMt
```

Open a page in PageBuilder Editor using the ID from the output:
```
https://YOURORG.arcpublishing.com/pagebuilder/editor/curate?p=PAGEID
```

### Data Export Views

| Script | Description |
|---|---|
| `npm run view-pages` | Dump `view_page_and_template` |
| `npm run view-rendering` | Dump `view_rendering` |
| `npm run view-resolvers` | Dump `view_resolver` |

```bash
npm run view-pages csv
```

### DuckDB GUI

| Script | Description |
|---|---|
| `npm run gui` | Open DuckDB GUI in the browser (requires DuckDB CLI v1.1+) |

---

## CSV & JSON Output

All commands accept `csv` or `json` as an output flag. Files are automatically saved to the `output/` directory with a generated filename:

```
{command}_{param}_{YYYYMMDDTHHMMSS}.{csv|json}
```

Examples:

```bash
npm run all-features csv          # → output/all-features_20260421T165813.csv
npm run find-feature n=Article/Body json  # → output/find-feature_Article_Body_20260421T165820.json
npm run describe i=p123456 csv   # → output/describe_meta_p123456_20260421T165830.csv
                                  #   output/describe_chains_p123456_20260421T165830.csv
                                  #   output/describe_features_p123456_20260421T165830.csv
                                  #   output/describe_contentSources_p123456_20260421T165830.csv
```

The `describe` command in CSV mode saves one file per section. In JSON mode it saves a single file with all sections combined.

---

## All npm Scripts Reference

| Script | Command | Flags |
|---|---|---|
| `npm run setup` | Convert bson + create DuckDB views | — |
| `npm run all-features` | All features with usage counts | `csv` `json` |
| `npm run all-chains` | All chains with usage counts | `csv` `json` |
| `npm run all-pages` | All published page URIs | `csv` `json` |
| `npm run all-content-sources` | Content sources from features | `csv` `json` |
| `npm run all-resolvers-sources` | Content sources from resolvers | `csv` `json` |
| `npm run find-feature` | Pages using a feature | `n=<name> [csv] [json]` |
| `npm run find-chain` | Pages using a chain | `n=<name> [csv] [json]` |
| `npm run find-page` | Pages matching URI | `u=<uri> [csv] [json]` |
| `npm run find-content-source` | Features using a content source | `n=<name> [csv] [json]` |
| `npm run find-resolver` | Resolvers using a content source | `n=<name> [csv] [json]` |
| `npm run find-custom-field` | Features with a specific customFields key/value | `k=<key> v=<value> [f=<name,...>] [csv] [json]` |
| `npm run describe` | Describe a page or template | `i=<id> [csv] [json]` |
| `npm run view-pages` | Dump view_page_and_template | `csv` `json` |
| `npm run view-rendering` | Dump view_rendering | `csv` `json` |
| `npm run view-resolvers` | Dump view_resolver | `csv` `json` |
| `npm run gui` | Open DuckDB GUI in browser | — |

---

## Video Tutorial

[![Video Tutorial](https://img.youtube.com/vi/Sy3FjQv73VM/0.jpg)](https://www.youtube.com/watch?v=Sy3FjQv73VM)

Based on the original shell scripts — the concepts and workflow are the same.

---

## Updates

See [CONVERSION_RECORD.md](CONVERSION_RECORD.md) for how to sync upstream changes from the original shell scripts repo.
