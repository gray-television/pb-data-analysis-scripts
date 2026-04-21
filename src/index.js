#!/usr/bin/env node
import { Command } from "commander";
import { allFeaturesUsage } from "./queries/all-features-usage.js";
import { findPagesByFeatureName } from "./queries/find-pages-by-feature-name.js";
import { allChainsUsage } from "./queries/all-chains-usage.js";
import { findPagesByChainName } from "./queries/find-pages-by-chain-name.js";
import { allContentSourcesUsage } from "./queries/all-content-sources-usage.js";
import { allContentSourcesResolvers } from "./queries/all-content-sources-resolvers.js";
import { findFeaturesByContentSource } from "./queries/find-features-by-content-source.js";
import { findResolversByContentSource } from "./queries/find-resolvers-by-content-source.js";
import { allPageUrls } from "./queries/all-page-urls.js";
import { findPagesByUri } from "./queries/find-pages-by-uri.js";
import { describePageOrTemplate } from "./queries/describe-page-or-template.js";
import { viewPageAndTemplate } from "./queries/view-page-and-template.js";
import { viewRendering } from "./queries/view-rendering.js";
import { viewResolver } from "./queries/view-resolver.js";
import { gui } from "./queries/gui.js";

const program = new Command();
program.name("pb-analyze").description("Analyze Arc XP PageBuilder data locally").version("1.0.0");

function minLen(val, label) {
  if (!val || val.length < 2) {
    console.error(`Error: ${label} with at least 2 characters is required.`);
    process.exit(1);
  }
  return val;
}

function fmt(cmd) {
  return cmd.option("-c, --csv", "CSV output").option("-j, --json", "JSON output");
}

function tag(opts, command, param) {
  opts._command = command;
  opts._param = param || null;
  return opts;
}

// Features
fmt(program.command("all-features").description("All features with usage counts"))
  .action((opts) => allFeaturesUsage(tag(opts, "all-features")));
fmt(program.command("find-feature").description("Pages using a specific feature").requiredOption("-n, --name <name>", "Feature name"))
  .action((opts) => { minLen(opts.name, "Feature name"); findPagesByFeatureName(opts.name, tag(opts, "find-feature", opts.name)); });

// Chains
fmt(program.command("all-chains").description("All chains with usage counts"))
  .action((opts) => allChainsUsage(tag(opts, "all-chains")));
fmt(program.command("find-chain").description("Pages using a specific chain").requiredOption("-n, --name <name>", "Chain name"))
  .action((opts) => { minLen(opts.name, "Chain name"); findPagesByChainName(opts.name, tag(opts, "find-chain", opts.name)); });

// Content sources
fmt(program.command("all-content-sources").description("Content sources from feature configs"))
  .action((opts) => allContentSourcesUsage(tag(opts, "all-content-sources")));
fmt(program.command("all-resolvers-sources").description("Content sources from resolvers"))
  .action((opts) => allContentSourcesResolvers(tag(opts, "all-resolvers-sources")));
fmt(program.command("find-content-source").description("Features using a content source (LIKE match)").requiredOption("-n, --name <name>", "Content source filter"))
  .action((opts) => { minLen(opts.name, "Content source"); findFeaturesByContentSource(opts.name, tag(opts, "find-content-source", opts.name)); });
fmt(program.command("find-resolver").description("Resolvers using a content source (exact match)").requiredOption("-n, --name <name>", "Content source name"))
  .action((opts) => { minLen(opts.name, "Content source"); findResolversByContentSource(opts.name, tag(opts, "find-resolver", opts.name)); });

// Pages/URLs
fmt(program.command("all-pages").description("All published page URIs"))
  .action((opts) => allPageUrls(tag(opts, "all-pages")));
fmt(program.command("find-page").description("Pages matching URI filter").requiredOption("-u, --uri <uri>", "URI filter"))
  .action((opts) => { minLen(opts.uri, "URI filter"); findPagesByUri(opts.uri, tag(opts, "find-page", opts.uri)); });

// Describe
fmt(program.command("describe").description("Describe a page or template").requiredOption("-i, --id <id>", "Page or Template ID"))
  .action((opts) => { minLen(opts.id, "Page/Template ID"); describePageOrTemplate(opts.id, tag(opts, "describe", opts.id)); });

// Views
fmt(program.command("view-pages").description("Dump view_page_and_template"))
  .action((opts) => viewPageAndTemplate(tag(opts, "view-pages")));
fmt(program.command("view-rendering").description("Dump view_rendering"))
  .action((opts) => viewRendering(tag(opts, "view-rendering")));
fmt(program.command("view-resolvers").description("Dump view_resolver"))
  .action((opts) => viewResolver(tag(opts, "view-resolvers")));

// GUI
program.command("gui").description("Open DuckDB GUI in browser").action(gui);

program.parse();
