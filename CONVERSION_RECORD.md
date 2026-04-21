# Shell → Node.js Conversion Record

This document maps every original shell script to its Node.js equivalent so upstream changes from the main branch can be pulled in and applied to the Node app.

## Directory Structure

- `src/` — Node.js app (ESM) at project root, the primary way to run analysis
- `shell-scripts/` — Original shell scripts preserved for reference and upstream diffing
- `pb-data/` — User-provided PageBuilder data (gitignored)

## Architecture Mapping

| Shell Component | Node.js Equivalent | Notes |
|---|---|---|
| `bsondump` CLI | `bson` npm package | Parses `.bson` files directly, no external CLI needed |
| `duckdb` CLI | `duckdb` npm package | Official Node.js bindings, same SQL engine |
| `shell-scripts/_prepare.sh` | `src/prepare.js` | Converts bson→jsonl + creates DuckDB views |
| `shell-scripts/_duckdb-views.sql` | `src/views.sql` | **Copied as-is** — single source of truth for SQL views |
| `getopts` parsing | `commander` npm package | CLI argument parsing |
| ANSI color codes (`\033[0;33m`) | `chalk` npm package | Terminal coloring |
| `COPY ... TO STDOUT WITH (FORMAT CSV, HEADER)` | Built-in CSV formatting in `src/output.js` | Handles both table and CSV output |

## Script-to-Module Mapping

Each shell script maps 1:1 to a query module in `src/queries/`:

| Shell Script | Node Module | Parameters | Description |
|---|---|---|---|
| `shell-scripts/all-features-usage.sh` | `src/queries/all-features-usage.js` | `[-c]` | All features with usage counts |
| `shell-scripts/find-pages-by-feature-name.sh` | `src/queries/find-pages-by-feature-name.js` | `-n <name> [-c]` | Pages using a specific feature |
| `shell-scripts/all-chains-usage.sh` | `src/queries/all-chains-usage.js` | `[-c]` | All chains with usage counts |
| `shell-scripts/find-pages-by-chain-name.sh` | `src/queries/find-pages-by-chain-name.js` | `-n <name> [-c]` | Pages using a specific chain |
| `shell-scripts/all-content-sources-usage.sh` | `src/queries/all-content-sources-usage.js` | `[-c]` | Content sources from feature configs |
| `shell-scripts/all-content-sources-resolvers.sh` | `src/queries/all-content-sources-resolvers.js` | `[-c]` | Content sources from resolvers |
| `shell-scripts/find-features-by-content-source.sh` | `src/queries/find-features-by-content-source.js` | `-n <name> [-c]` | Features using a content source (LIKE match) |
| `shell-scripts/find-resolvers-by-content-source.sh` | `src/queries/find-resolvers-by-content-source.js` | `-n <name> [-c]` | Resolvers using a content source (exact match) |
| `shell-scripts/all-page-urls.sh` | `src/queries/all-page-urls.js` | `[-c]` | All published page URIs |
| `shell-scripts/find-pages-by-uri.sh` | `src/queries/find-pages-by-uri.js` | `-u <uri> [-c]` | Pages matching URI filter |
| `shell-scripts/describe-page-or-template.sh` | `src/queries/describe-page-or-template.js` | `-i <id>` | Describe a page/template (multi-query) |
| `shell-scripts/view-page-and-template.sh` | `src/queries/view-page-and-template.js` | `[-c]` | Dump view_page_and_template |
| `shell-scripts/view-rendering.sh` | `src/queries/view-rendering.js` | `[-c]` | Dump view_rendering |
| `shell-scripts/view-resolver.sh` | `src/queries/view-resolver.js` | `[-c]` | Dump view_resolver |
| `shell-scripts/help.sh` | Built into `src/index.js` | `--help` | Commander auto-generates help |
| `shell-scripts/gui.sh` | `src/queries/gui.js` | (none) | Opens DuckDB UI |

## How to Sync Upstream Changes

When the main branch gets updates:

1. **New shell script added**: Create a matching module in `src/queries/`, register it as a subcommand in `src/index.js`, add a row to this table.
2. **SQL view changes in `_duckdb-views.sql`**: Copy the updated SQL into `src/views.sql`. Apply the `unnest` syntax fix if needed (`unnest(...) as t(k)` instead of `unnest(...) as key` then `key.unnest`) for DuckDB v1.0.0 compat.
3. **Query logic changes in a `.sh` file**: Update the SQL string in the corresponding `src/queries/*.js` module.
4. **New parameter added to existing script**: Update the commander option definition in the corresponding query module.

## DuckDB Compatibility Note

The upstream SQL uses `unnest(json_keys(x)) as key` then `key.unnest` which doesn't work in DuckDB v1.0.0. The Node app's `views.sql` uses `unnest(json_keys(x)) as t(k)` then `k` instead. When syncing `_duckdb-views.sql`, apply this transformation to any `unnest` + alias patterns.
