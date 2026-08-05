import fs from "fs";
import { output } from "../output.js";

export function pageRenditions(id, opts) {
  const lines = fs.readFileSync("pb-data/page.json", "utf8").split("\n");
  const page = lines
    .map((l) => { try { return JSON.parse(l); } catch { return null; } })
    .find((p) => p && p._id === id);

  if (!page) {
    // also check templates
    const tlines = fs.readFileSync("pb-data/template.json", "utf8").split("\n");
    const tmpl = tlines
      .map((l) => { try { return JSON.parse(l); } catch { return null; } })
      .find((p) => p && p._id === id);
    if (!tmpl) { console.error(`No page or template found with id: ${id}`); process.exit(1); }
    return _output(tmpl, opts);
  }
  _output(page, opts);
}

function _output(doc, opts) {
  const rows = [];
  for (const [versionId, version] of Object.entries(doc.versions || {})) {
    const isPublished = versionId === doc.published;
    if (version.head) rows.push({ renditionId: version.head, type: "head", owner: isPublished ? "(published)" : versionId, versionId });
    if (version.stage) rows.push({ renditionId: version.stage, type: "stage", owner: isPublished ? "(published)" : versionId, versionId });
    for (const [user, rId] of Object.entries(version.drafts || {})) {
      rows.push({ renditionId: rId, type: "draft", owner: user, versionId });
    }
  }
  output(rows, opts, "renditions");
}
