# PB-Data Analysis Scripts — Amazon Q Rules

## Project Overview
This project contains shell scripts to analyze Arc XP PageBuilder data (pb-data) locally using `bsondump` (MongoDB Tools) and `duckdb`. The pb-data is a database snapshot of PageBuilder data taken every 12 hours, downloaded from Arc XP Admin > PageBuilder > Developer Tools > PB Data.

## Prerequisites
- **MongoDB Tools**: Provides `bsondump` command to convert `.bson` files to `.jsonl` — https://www.mongodb.com/docs/database-tools/installation/installation-macos/
- **DuckDB CLI**: Allows running SQL queries over CSV/JSONL files — https://duckdb.org/docs/api/cli/overview.html#installation
- Both `bsondump` and `duckdb` must be available in the current shell session's PATH.

## Setup Workflow
1. Download pb-data from: Arc XP Admin > PageBuilder > Developer Tools > PB Data
2. Untar the downloaded file, rename the folder to `pb-data`, and place it in the project root
3. Run `sh _prepare.sh` to:
   - Convert all `.bson` files in `pb-data/` to `.jsonl` using `bsondump`
   - Create a temporary DuckDB database (`_tmpview.db`) with SQL views defined in `_duckdb-views.sql`
4. Run any analysis script after preparation is complete

## Key Architecture
- `_duckdb-views.sql` defines the SQL views (`view_page_and_template`, `view_rendering`, `view_resolver`) that all scripts query against
- `_tmpview.db` is the generated DuckDB database file — it is gitignored and must be regenerated via `_prepare.sh` after each new pb-data download
- `pb-data/` folder is gitignored and must be provided by the user
- All scripts are standalone shell scripts that query `_tmpview.db` using the `duckdb` CLI

## Available Scripts and Their Tasks

### Describing Pages/Templates
- `sh describe-page-or-template.sh -i <page_or_template_id>` — Shows metadata (URI, title), list of chains & features sorted by usage count, and configured content sources for a specific page or template

### Feature Analysis
- `sh all-features-usage.sh [-c]` — Lists all features in published pages/templates with usage counts, sorted by most-used
- `sh find-pages-by-feature-name.sh -n <feature_name> [-c]` — Lists pages/templates using a specific feature (exact match)

### Chain Analysis
- `sh all-chains-usage.sh [-c]` — Lists all chains in published pages/templates with usage counts
- `sh find-pages-by-chain-name.sh -n <chain_name> [-c]` — Lists pages/templates using a specific chain

### Content Source Analysis
- `sh all-content-sources-usage.sh [-c]` — Lists all content sources from both resolver configs and feature configs
- `sh find-features-by-content-source.sh -n <content_source> [-c]` — Lists features using a content source (like/fuzzy match)
- `sh all-content-sources-resolvers.sh [-c]` — Lists content sources from route resolver configurations only
- `sh find-resolvers-by-content-source.sh -n <content_source> [-c]` — Lists resolvers using a specific content source (exact match)

### Page/URL Analysis
- `sh all-page-urls.sh [-c]` — Lists all published pages with URIs (excludes templates since they use dynamic URL patterns from resolvers)
- `sh find-pages-by-uri.sh -u <uri_filter> [-c]` — Lists pages with URI containing the provided filter

### Data Export Views
- `sh view-page-and-template.sh [-c]` — Dumps the full `view_page_and_template` view
- `sh view-rendering.sh [-c]` — Dumps the full `view_rendering` view
- `sh view-resolver.sh [-c]` — Dumps the full `view_resolver` view

### Utility
- `sh help.sh` — Lists all available scripts with descriptions
- `sh gui.sh` — Opens DuckDB GUI in the browser to explore the dataset interactively

## Script Conventions
- `-n` parameter: Name/filter input (required, minimum 2 characters) for search scripts
- `-u` parameter: URI filter (required, minimum 2 characters) for `find-pages-by-uri.sh`
- `-i` parameter: Page or Template ID (required, minimum 2 characters) for `describe-page-or-template.sh`
- `-c` flag: Outputs CSV format instead of table view (can be piped to a file, e.g., `sh all-features-usage.sh -c > output.csv`)
- `-h` flag: Shows help text for each script
- All scripts use yellow ANSI color codes for headers in table output mode
- Scripts query the `_tmpview.db` DuckDB database file

## Opening Pages in PageBuilder Editor
Use this URL template with a page or template ID from script output:
```
https://YOURORG.arcpublishing.com/pagebuilder/editor/curate?p=PAGEID
```

## When Modifying or Creating Scripts
- Follow the existing pattern: parse options with `getopts`, validate required params, build a SQL query string, conditionally wrap in `COPY ... TO STDOUT WITH (FORMAT CSV, HEADER)` for CSV mode
- All SQL queries should reference the views in `_tmpview.db` (`view_page_and_template`, `view_rendering`, `view_resolver`)
- Filter to published versions only for performance (the views already handle this)
- Use `LEFT JOIN view_page_and_template ON view_page_and_template.published = view_rendering.renderingVersionId` to join renderings to pages
- Include `-h` help option in all scripts
- Update `help.sh` and `README.md` when adding new scripts

## Important Notes
- This is a community-maintained project under MIT license with NO WARRANTY, SLA, or SUPPORT
- The pb-data snapshot is read-only analysis data — these scripts do not modify any Arc XP data
- After pulling new code from the repository, always re-run `sh _prepare.sh` to regenerate views
- Performance was optimized by filtering to published versions only and latest renderings (95%+ reduction in rendering items)
