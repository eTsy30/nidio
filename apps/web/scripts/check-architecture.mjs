/* global console, process */

import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

const root = process.cwd();
const layers = ["app", "screens", "widgets", "features", "shared"];
const rank = new Map(layers.map((layer, index) => [layer, index]));

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory())
        return entry.name === "node_modules" || entry.name === ".next" ? [] : files(path);
      return /\.(ts|tsx)$/.test(entry.name) ? [path] : [];
    }),
  );
  return nested.flat();
}

const violations = [];
for (const file of await files(root)) {
  const sourceLayer = relative(root, file).split("/")[0];
  if (!rank.has(sourceLayer)) continue;
  const source = await readFile(file, "utf8");
  for (const match of source.matchAll(/from\s+["']@\/([^/]+)(?:\/([^"']*))?["']/g)) {
    const targetLayer = match[1];
    if (!rank.has(targetLayer)) continue;
    if (rank.get(targetLayer) < rank.get(sourceLayer)) {
      violations.push(`${relative(root, file)} imports higher layer @/${targetLayer}`);
    }
    if (sourceLayer === "features" && targetLayer === "features") {
      const sourceSlice = relative(root, file).split("/")[1];
      const targetSlice = match[2]?.split("/")[0];
      if (sourceSlice && targetSlice && sourceSlice !== targetSlice) {
        violations.push(`${relative(root, file)} imports feature slice @/features/${targetSlice}`);
      }
    }
  }
}

if (violations.length) {
  console.error("Architecture boundary violations:\n" + violations.join("\n"));
  process.exit(1);
}

console.log("Architecture boundaries: PASS");
