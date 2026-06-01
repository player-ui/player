#!/usr/bin/env node
// Scans for all */benchmarks/current.json files (vitest bench outputJson format),
// compares each against the corresponding baseline.json, and prints a combined
// markdown table suitable for a GitHub PR comment.

import fs from "fs";
import path from "path";

const LOWER_BOUND = -0.1;
const UPPER_BOUND = 0.05;

function formatHz(hz) {
  if (hz >= 1_000_000) return `${(hz / 1_000_000).toFixed(2)}M`;
  if (hz >= 1_000) return `${(hz / 1_000).toFixed(2)}K`;
  return hz.toFixed(2);
}

// Flatten vitest bench JSON into { "group > name": benchmarkEntry }
function flatten(report) {
  const out = {};
  for (const file of report.files ?? []) {
    for (const group of file.groups ?? []) {
      for (const bench of group.benchmarks ?? []) {
        const key = `${group.fullName} > ${bench.name}`;
        out[key] = bench;
      }
    }
  }
  return out;
}

function findCurrentFiles(dir, results = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    if (
      entry.name.startsWith("bazel-") ||
      entry.name === "node_modules" ||
      entry.name.startsWith(".")
    ) {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findCurrentFiles(full, results);
    } else if (
      entry.isFile() &&
      entry.name === "current.json" &&
      path.basename(path.dirname(full)) === "benchmarks"
    ) {
      results.push(full);
    }
  }
  return results;
}

const repoRoot = process.cwd();
const currentFiles = findCurrentFiles(repoRoot);
const sections = [];

for (const currentFile of currentFiles.sort()) {
  const benchDir = path.dirname(currentFile);
  const baselineFile = path.join(benchDir, "baseline.json");

  if (!fs.existsSync(baselineFile)) continue;

  let current, baseline;
  try {
    current = JSON.parse(fs.readFileSync(currentFile, "utf-8"));
    baseline = JSON.parse(fs.readFileSync(baselineFile, "utf-8"));
  } catch {
    continue;
  }

  const currentFlat = flatten(current);
  const baselineFlat = flatten(baseline);

  if (Object.keys(currentFlat).length === 0) continue;
  if (Object.keys(baselineFlat).length === 0) continue;

  const packagePath = path.relative(repoRoot, path.dirname(benchDir));
  const allKeys = new Set([
    ...Object.keys(currentFlat),
    ...Object.keys(baselineFlat),
  ]);

  const rows = [];
  let hasRegression = false;

  for (const key of allKeys) {
    const cur = currentFlat[key];
    const base = baselineFlat[key];

    if (!cur) {
      rows.push(`| ${key} | — | ${formatHz(base.hz)} ops/s | removed |`);
      continue;
    }
    if (!base) {
      rows.push(`| ${key} | ${formatHz(cur.hz)} ops/s | — | new |`);
      continue;
    }

    const delta = (cur.hz - base.hz) / base.hz;
    const pct = (delta * 100).toFixed(1);
    const sign = delta >= 0 ? "+" : "";
    const badge =
      delta <= LOWER_BOUND ? " ⚠️" : delta >= UPPER_BOUND ? " ✅" : "";
    if (delta <= LOWER_BOUND) hasRegression = true;
    rows.push(
      `| \`${key}\` | ${formatHz(cur.hz)} ops/s | ${formatHz(base.hz)} ops/s | ${sign}${pct}%${badge} |`,
    );
  }

  if (rows.length > 0) {
    const heading = hasRegression
      ? `### \`${packagePath}\` ⚠️`
      : `### \`${packagePath}\``;
    sections.push(
      [
        heading,
        "",
        "| Benchmark | Current | Baseline | Change |",
        "|-----------|---------|----------|--------|",
        ...rows,
      ].join("\n"),
    );
  }
}

if (sections.length === 0) {
  process.exit(0);
}

console.log("## Benchmark Results\n");
console.log(
  `_Comparison against baseline from \`main\`. ⚠️ = regression (>${LOWER_BOUND * -100}}% slower), ✅ = improvement (>${UPPER_BOUND * 100}% faster)_\n`,
);
console.log(sections.join("\n\n"));
