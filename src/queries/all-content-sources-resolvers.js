import { query, close } from "../db.js";
import { output } from "../output.js";

export async function allContentSourcesResolvers(opts) {
  const rows = await query(`SELECT * FROM (
    SELECT contentSourceId, COUNT(1) as countOfResolvers
    FROM view_resolver
    GROUP BY contentSourceId
  ) ORDER BY countOfResolvers DESC`);
  output(rows, opts, "Global content sources in resolvers");
  close();
}
