#!/usr/bin/env node
import { parseCliArgs } from "./cli.js";
import { allFeaturesUsage } from "./queries/all-features-usage.js";
import { findPagesByFeatureName } from "./queries/find-pages-by-feature-name.js";
import { allChainsUsage } from "./queries/all-chains-usage.js";
import { findPagesByChainName } from "./queries/find-pages-by-chain-name.js";
import { allContentSourcesUsage } from "./queries/all-content-sources-usage.js";
import { allContentSourcesResolvers } from "./queries/all-content-sources-resolvers.js";
import { findFeaturesByContentSource } from "./queries/find-features-by-content-source.js";
import { findResolversByContentSource } from "./queries/find-resolvers-by-content-source.js";
import { findFeaturesByCustomField } from "./queries/find-features-by-custom-field.js";
import { allPageUrls } from "./queries/all-page-urls.js";
import { findPagesByUri } from "./queries/find-pages-by-uri.js";
import { describePageOrTemplate } from "./queries/describe-page-or-template.js";
import { viewPageAndTemplate } from "./queries/view-page-and-template.js";
import { viewRendering } from "./queries/view-rendering.js";
import { viewResolver } from "./queries/view-resolver.js";
import { gui } from "./queries/gui.js";

const args = parseCliArgs(process.argv);
const command = process.argv[2];

function minLen(val, label) {
  if (!val || String(val).length < 2) {
    console.error(`Error: ${label} with at least 2 characters is required.`);
    process.exit(1);
  }
}

function opts(command, param) {
  return { csv: args.c || args.csv, json: args.j || args.json || args.J, _command: command, _param: param || null };
}

const commands = {
  "all-features": () => allFeaturesUsage(opts("all-features")),
  "find-feature": () => { const n = args.n || args.name; minLen(n, "Feature name"); findPagesByFeatureName(n, opts("find-feature", n)); },
  "all-chains": () => allChainsUsage(opts("all-chains")),
  "find-chain": () => { const n = args.n || args.name; minLen(n, "Chain name"); findPagesByChainName(n, opts("find-chain", n)); },
  "all-content-sources": () => allContentSourcesUsage(opts("all-content-sources")),
  "all-resolvers-sources": () => allContentSourcesResolvers(opts("all-resolvers-sources")),
  "find-content-source": () => { const n = args.n || args.name; minLen(n, "Content source"); findFeaturesByContentSource(n, opts("find-content-source", n)); },
  "find-resolver": () => { const n = args.n || args.name; minLen(n, "Content source"); findResolversByContentSource(n, opts("find-resolver", n)); },
  "find-custom-field": () => { const k = args.k || args.key; const v = args.v || args.value; minLen(k, "Field key"); minLen(v, "Field value"); findFeaturesByCustomField(k, v, { ...opts("find-custom-field", `${k}_${v}`), f: args.f || args.features || null }); },
  "all-pages": () => allPageUrls(opts("all-pages")),
  "find-page": () => { const u = args.u || args.uri; minLen(u, "URI filter"); findPagesByUri(u, opts("find-page", u)); },
  "describe": () => { const i = args.i || args.id; minLen(i, "Page/Template ID"); describePageOrTemplate(i, opts("describe", i)); },
  "view-pages": () => viewPageAndTemplate(opts("view-pages")),
  "view-rendering": () => viewRendering(opts("view-rendering")),
  "view-resolvers": () => viewResolver(opts("view-resolvers")),
  "gui": () => gui(),
};

if (!command || args.help || args.h) {
  console.log(`
Usage: node src/index.js <command> [key=value ...]
   or: npm run <script> [key=value ...]

Commands:
  all-features                All features with usage counts
  find-feature   n=<name>    Pages using a specific feature
  all-chains                  All chains with usage counts
  find-chain     n=<name>    Pages using a specific chain
  all-content-sources         Content sources from feature configs
  all-resolvers-sources       Content sources from resolvers
  find-content-source n=<name>  Features using a content source (LIKE match)
  find-resolver  n=<name>    Resolvers using a content source (exact match)
  find-custom-field k=<key> v=<value>  Features with a specific customFields key/value
  all-pages                   All published page URIs
  find-page      u=<uri>     Pages matching URI filter
  describe       i=<id>      Describe a page or template
  view-pages                  Dump view_page_and_template
  view-rendering              Dump view_rendering
  view-resolvers              Dump view_resolver
  gui                         Open DuckDB GUI in browser

Output flags (append to any command):
  csv                         Save CSV to output/
  json                        Save JSON to output/

Examples:
  npm run all-features
  npm run all-features csv
  npm run find-feature n=global/Footer json
  npm run describe i=p9NRAEBz90bytDMt csv
`);
  process.exit(0);
}

if (!commands[command]) {
  console.error(`Unknown command: ${command}\nRun with no arguments to see help.`);
  process.exit(1);
}

commands[command]();
