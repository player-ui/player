/**
 * Generate hook documentation from source code.
 *
 * Goals:
 * - Code-driven: extract hook names/types/docs directly from the repo
 * - Fast: parse AST without typechecking
 * - Deterministic: stable output ordering for clean diffs
 *
 * Usage:
 *   node scripts/docs/generate-hooks-docs.mjs
 *   node scripts/docs/generate-hooks-docs.mjs --out docs/site/src/content/docs/plugins/hooks.mdx
 *   node scripts/docs/generate-hooks-docs.mjs --roots core/player/src --roots plugins
 */

/* eslint-env node */
/* global console */

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

// Use CommonJS resolution (via createRequire) so Bazel genrules can load deps by absolute path.
const require = createRequire(import.meta.url);
/** @type {import("typescript")} */
let ts;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../..");

const DEFAULT_ROOTS = ["core/player/src"];
const DEFAULT_OUT = "docs/site/src/content/docs/plugins/hooks.mdx";

async function collectTsFiles(rootDirAbs) {
  /** @type {string[]} */
  const files = [];

  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        if (ent.name === "node_modules" || ent.name === "__tests__") continue;
        await walk(full);
      } else if (ent.isFile() && ent.name.endsWith(".ts")) {
        if (ent.name.endsWith(".test.ts") || ent.name.endsWith(".spec.ts"))
          continue;
        files.push(full);
      }
    }
  }

  await walk(rootDirAbs);
  return files;
}

function parseArgs(argv) {
  const args = {
    roots: [],
    out: DEFAULT_OUT,
    check: false,
    typescriptPath: undefined,
    filesList: undefined,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--roots") {
      const value = argv[i + 1];
      if (!value) throw new Error("--roots requires a value");
      args.roots.push(value);
      i += 1;
      continue;
    }
    if (arg === "--out") {
      const value = argv[i + 1];
      if (!value) throw new Error("--out requires a value");
      args.out = value;
      i += 1;
      continue;
    }
    if (arg === "--check") {
      args.check = true;
      continue;
    }
    if (arg === "--files-list") {
      const value = argv[i + 1];
      if (!value) throw new Error("--files-list requires a value");
      args.filesList = value;
      i += 1;
      continue;
    }
    if (arg === "--typescript-path") {
      const value = argv[i + 1];
      if (!value) throw new Error("--typescript-path requires a value");
      args.typescriptPath = value;
      i += 1;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      args.help = true;
      continue;
    }
    throw new Error(`Unknown arg: ${arg}`);
  }

  if (args.roots.length === 0) args.roots = DEFAULT_ROOTS;
  return args;
}

function toPos(sourceFile, node) {
  const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
  return line + 1;
}

function getSingleLine(text) {
  return text.replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();
}

function getJSDocSummary(node) {
  // Prefer structured jsDoc when available
  const jsDocs = node.jsDoc;
  if (Array.isArray(jsDocs) && jsDocs.length > 0) {
    const comment = jsDocs[jsDocs.length - 1]?.comment;
    if (typeof comment === "string") return getSingleLine(comment);
    if (Array.isArray(comment)) {
      // TS may represent rich comments as arrays; stringify best-effort
      return getSingleLine(comment.map((c) => c.text ?? "").join(""));
    }
  }
  return undefined;
}

function stripHooksSuffix(name) {
  return name.endsWith("Hooks") ? name.slice(0, -5) : name;
}

function defaultAccessor(owner) {
  const map = new Map([
    ["Player", "player"],
    ["FlowController", "flowController"],
    ["FlowInstance", "flow"],
    ["ViewController", "viewController"],
    ["ViewInstance", "view"],
    ["DataController", "dataController"],
    ["ExpressionEvaluator", "expressionEvaluator"],
    ["SchemaController", "schema"],
    ["ValidationController", "validation"],
    ["BindingParser", "bindingParser"],
  ]);
  return map.get(owner) ?? owner[0].toLowerCase() + owner.slice(1);
}

function isHooksTypeName(nameText) {
  return (
    nameText === "PlayerHooks" ||
    nameText.endsWith("Hooks") ||
    nameText.endsWith("Hook") // some are singular, e.g. ResolveBindingASTHooks
  );
}

function hookTypeInfoFromTypeNode(typeNode, sourceFile) {
  if (!typeNode) return null;
  if (!ts.isTypeReferenceNode(typeNode)) return null;

  const typeNameText = typeNode.typeName.getText(sourceFile);
  const isTapable =
    typeNameText === "SyncHook" ||
    typeNameText === "SyncWaterfallHook" ||
    typeNameText === "SyncBailHook";

  if (!isTapable) return null;

  const typeArgs =
    typeNode.typeArguments?.map((t) => t.getText(sourceFile)) ?? [];
  return { hookType: typeNameText, typeArgs };
}

function hookTypeInfoFromNewExpr(expr, sourceFile) {
  if (!expr || !ts.isNewExpression(expr)) return null;
  const ctorText = expr.expression.getText(sourceFile);
  const isTapable =
    ctorText === "SyncHook" ||
    ctorText === "SyncWaterfallHook" ||
    ctorText === "SyncBailHook";
  if (!isTapable) return null;
  const typeArgs = expr.typeArguments?.map((t) => t.getText(sourceFile)) ?? [];
  return { hookType: ctorText, typeArgs };
}

/**
 * @typedef {{
 *  owner: string;
 *  hook: string;
 *  hookType: string;
 *  typeArgs: string[];
 *  description?: string;
 *  hooksTypeRef?: string;
 *  file: string;
 *  line: number;
 *  sourceKind: 'interface' | 'type' | 'class';
 * }} HookDoc
 */

/**
 * Extract hook type definitions from `interface FooHooks { ... }` or `type FooHooks = { ... }`.
 * These provide the most accurate signatures + JSDoc, and can be used to enrich class hook initializers.
 *
 * @param {ts.SourceFile} sourceFile
 * @returns {Map<string, Map<string, {hookType: string, typeArgs: string[], description?: string}>>}
 */
function extractHookTypeDefinitions(sourceFile) {
  /** @type {Map<string, Map<string, {hookType: string, typeArgs: string[], description?: string}>>} */
  const defs = new Map();

  const add = (hooksTypeName, hookName, info, description) => {
    const byHook = defs.get(hooksTypeName) ?? new Map();
    byHook.set(hookName, { ...info, description });
    defs.set(hooksTypeName, byHook);
  };

  sourceFile.forEachChild((node) => {
    if (ts.isInterfaceDeclaration(node) && node.name) {
      const hooksTypeName = node.name.text;
      if (!isHooksTypeName(hooksTypeName)) return;

      for (const member of node.members) {
        if (!ts.isPropertySignature(member) || !member.name) continue;
        const hookName = member.name
          .getText(sourceFile)
          .replace(/^["']|["']$/g, "");
        const info = hookTypeInfoFromTypeNode(member.type, sourceFile);
        if (!info) continue;
        add(hooksTypeName, hookName, info, getJSDocSummary(member));
      }
    }

    if (ts.isTypeAliasDeclaration(node) && node.name) {
      const hooksTypeName = node.name.text;
      if (!isHooksTypeName(hooksTypeName)) return;
      if (!node.type || !ts.isTypeLiteralNode(node.type)) return;

      for (const member of node.type.members) {
        if (!ts.isPropertySignature(member) || !member.name) continue;
        const hookName = member.name
          .getText(sourceFile)
          .replace(/^["']|["']$/g, "");
        const info = hookTypeInfoFromTypeNode(member.type, sourceFile);
        if (!info) continue;
        add(hooksTypeName, hookName, info, getJSDocSummary(member));
      }
    }
  });

  return defs;
}

/**
 * Extract hook docs from a TypeScript source file without typechecking.
 * @param {ts.SourceFile} sourceFile
 * @param {string} relPath
 * @returns {HookDoc[]}
 */
function extractHooksFromSourceFile(sourceFile, relPath) {
  /** @type {HookDoc[]} */
  const out = [];

  /** Walk interfaces/types that define hook shapes */
  sourceFile.forEachChild((node) => {
    if (ts.isInterfaceDeclaration(node) && node.name) {
      const name = node.name.text;
      if (!isHooksTypeName(name)) return;

      const owner = stripHooksSuffix(name);
      for (const member of node.members) {
        if (!ts.isPropertySignature(member) || !member.name) continue;
        const hookName = member.name
          .getText(sourceFile)
          .replace(/^["']|["']$/g, "");
        const info = hookTypeInfoFromTypeNode(member.type, sourceFile);
        if (!info) continue;

        out.push({
          owner,
          hook: hookName,
          hookType: info.hookType,
          typeArgs: info.typeArgs,
          description: getJSDocSummary(member),
          file: relPath,
          line: toPos(sourceFile, member),
          sourceKind: "interface",
        });
      }
    }

    if (ts.isTypeAliasDeclaration(node) && node.name) {
      const name = node.name.text;
      if (!isHooksTypeName(name)) return;
      if (!node.type || !ts.isTypeLiteralNode(node.type)) return;

      const owner = stripHooksSuffix(name);
      for (const member of node.type.members) {
        if (!ts.isPropertySignature(member) || !member.name) continue;
        const hookName = member.name
          .getText(sourceFile)
          .replace(/^["']|["']$/g, "");
        const info = hookTypeInfoFromTypeNode(member.type, sourceFile);
        if (!info) continue;

        out.push({
          owner,
          hook: hookName,
          hookType: info.hookType,
          typeArgs: info.typeArgs,
          description: getJSDocSummary(member),
          file: relPath,
          line: toPos(sourceFile, member),
          sourceKind: "type",
        });
      }
    }

    return undefined;
  });

  /** Walk classes with a `hooks = { ... }` object literal */
  sourceFile.forEachChild((node) => {
    if (!ts.isClassDeclaration(node) || !node.name) return;

    const owner = node.name.text;
    for (const member of node.members) {
      if (!ts.isPropertyDeclaration(member) || !member.name) continue;
      const propName = member.name.getText(sourceFile);
      if (propName !== "hooks") continue;

      // If the property is typed (e.g., `public hooks: ViewHooks = { ... }`),
      // use this to enrich signatures/descriptions later.
      let hooksTypeRef;
      if (member.type && ts.isTypeReferenceNode(member.type)) {
        hooksTypeRef = member.type.typeName.getText(sourceFile);
      }

      const init = member.initializer;
      if (!init || !ts.isObjectLiteralExpression(init)) continue;

      for (const p of init.properties) {
        if (!ts.isPropertyAssignment(p)) continue;
        const hookName = p.name.getText(sourceFile).replace(/^["']|["']$/g, "");
        const info = hookTypeInfoFromNewExpr(p.initializer, sourceFile);
        if (!info) continue;

        out.push({
          owner,
          hook: hookName,
          hookType: info.hookType,
          typeArgs: info.typeArgs,
          description: undefined,
          hooksTypeRef,
          file: relPath,
          line: toPos(sourceFile, p),
          sourceKind: "class",
        });
      }
    }
  });

  return out;
}

function renderMDX(hooks) {
  const escapeHtml = (s) =>
    String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      // MDX treats `{...}` inside JSX/HTML nodes as expressions, so escape braces
      .replaceAll("{", "&#123;")
      .replaceAll("}", "&#125;");

  const stripBlockComments = (s) => String(s).replace(/\/\*[\s\S]*?\*\//g, "");

  // Prefer interface/type-derived entries over class-derived ones for the same owner.hook
  /** @type {Map<string, HookDoc>} */
  const best = new Map();
  const rank = { interface: 3, type: 2, class: 1 };
  for (const h of hooks) {
    const key = `${h.owner}.${h.hook}`;
    const existing = best.get(key);
    if (!existing || rank[h.sourceKind] > rank[existing.sourceKind]) {
      best.set(key, h);
    }
  }

  const deduped = Array.from(best.values()).sort((a, b) => {
    if (a.owner !== b.owner) return a.owner.localeCompare(b.owner);
    return a.hook.localeCompare(b.hook);
  });

  /** @type {Map<string, HookDoc[]>} */
  const byOwner = new Map();
  for (const h of deduped) {
    const list = byOwner.get(h.owner) ?? [];
    list.push(h);
    byOwner.set(h.owner, list);
  }

  const lines = [];
  lines.push("---");
  lines.push("title: Hooks");
  lines.push("description: Reference documentation for hook entry points.");
  lines.push("autogenerated: true");
  lines.push('update: "pnpm docs:hooks"');
  lines.push("---");
  lines.push("");
  lines.push(
    "Hooks allow plugins and integrations to observe or modify behavior at well-defined points in the pipeline.",
  );
  lines.push("");
  lines.push(
    "Use the sections below to find the hook you need, then tap it from the corresponding `.hooks` object.",
  );
  lines.push("");

  // Keep per-owner headings for scanability, and enforce consistent column widths:
  // - Hook and Type are fixed px widths
  // - Signature fills remaining width via calc(...)
  const HOOK_COL_PX = 250;
  const TYPE_COL_PX = 200;

  for (const [owner, list] of byOwner.entries()) {
    const accessor = defaultAccessor(owner);
    lines.push(`## ${owner}`);
    lines.push("");
    lines.push(`Access pattern: \`${accessor}.hooks.<name>\``);
    lines.push("");

    // Fixed layout ensures first columns keep their intended widths.
    lines.push('<table style="width:100%;table-layout:fixed">');
    lines.push("  <colgroup>");
    // In MDX/JSX, void elements must be self-closing.
    lines.push(`    <col style="width:${HOOK_COL_PX}px" />`);
    lines.push(`    <col style="width:${TYPE_COL_PX}px" />`);
    lines.push("    <col />");
    lines.push("  </colgroup>");
    lines.push("  <thead>");
    lines.push("    <tr>");
    lines.push('      <th align="left" style="white-space:nowrap">Hook</th>');
    lines.push('      <th align="left" style="white-space:nowrap">Type</th>');
    lines.push('      <th align="left">Signature</th>');
    lines.push("    </tr>");
    lines.push("  </thead>");
    lines.push("  <tbody>");

    for (const h of list) {
      const signature =
        h.typeArgs.length > 0
          ? getSingleLine(stripBlockComments(h.typeArgs.join(", ")))
          : "";
      const desc = h.description ? escapeHtml(h.description) : "";

      const sigHtml = signature ? `<code>${escapeHtml(signature)}</code>` : "";
      const descHtml = desc ? `<div><small>${desc}</small></div>` : "";

      lines.push("    <tr>");
      lines.push(
        `      <td style="white-space:nowrap"><code>${escapeHtml(
          h.hook,
        )}</code></td>`,
      );
      lines.push(
        `      <td style="white-space:nowrap"><code>${escapeHtml(
          h.hookType,
        )}</code></td>`,
      );
      lines.push(
        `      <td style="white-space:normal;word-break:break-word">${sigHtml}${descHtml}</td>`,
      );
      lines.push("    </tr>");
    }

    lines.push("  </tbody>");
    lines.push("</table>");
    lines.push("");
  }

  return lines.join("\n");
}

async function main() {
  const args = parseArgs(process.argv);

  if (args.help) {
    console.log(`Usage:
  node scripts/docs/generate-hooks-docs.mjs [--roots <dir>]... [--out <file>] [--check] [--files-list <path>] [--typescript-path <dir>]

Defaults:
  --roots ${DEFAULT_ROOTS.join(" ")}
  --out   ${DEFAULT_OUT}
`);
    return;
  }

  // Load TypeScript compiler API.
  // In Bazel, pass an explicit directory containing the package (e.g. ".../node_modules/typescript")
  // so the genrule doesn't depend on a workspace-managed node_modules layout.
  if (args.typescriptPath) {
    // Bazel $(location ...) paths may be relative to the execroot.
    const tsDir = path.isAbsolute(args.typescriptPath)
      ? args.typescriptPath
      : path.resolve(process.cwd(), args.typescriptPath);
    ts = require(path.join(tsDir, "lib", "typescript.js"));
  } else {
    ts = require("typescript");
  }

  // We still accept roots, but collect files via fs traversal to avoid needing glob libraries in CI.
  // (Bazel should prefer --files-list to avoid directory walking entirely.)
  let files = [];
  if (args.filesList) {
    const listText = await fs.readFile(args.filesList, "utf8");
    files = listText
      .split(/\r?\n/g)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((p) => (path.isAbsolute(p) ? p : path.resolve(repoRoot, p)))
      .filter((p) => p.endsWith(".ts"))
      .sort();
  } else {
    const rootsAbs = args.roots.map((r) => path.resolve(repoRoot, r));
    const collected = await Promise.all(rootsAbs.map(collectTsFiles));
    files = collected.flat().sort();
  }

  /** @type {HookDoc[]} */
  const allHooks = [];

  /** @type {Map<string, Map<string, {hookType: string, typeArgs: string[], description?: string}>>} */
  const hookTypeDefs = new Map();

  for (const file of files) {
    const rel = path.relative(repoRoot, file).replaceAll(path.sep, "/");
    const text = await fs.readFile(file, "utf8");
    const sf = ts.createSourceFile(
      file,
      text,
      ts.ScriptTarget.Latest,
      /*setParentNodes*/ true,
      ts.ScriptKind.TS,
    );

    // Merge hook type definitions for later enrichment
    const defs = extractHookTypeDefinitions(sf);
    for (const [typeName, byHook] of defs.entries()) {
      const existingByHook = hookTypeDefs.get(typeName) ?? new Map();
      for (const [hookName, info] of byHook.entries()) {
        existingByHook.set(hookName, info);
      }
      hookTypeDefs.set(typeName, existingByHook);
    }

    const hooks = extractHooksFromSourceFile(sf, rel);
    allHooks.push(...hooks);
  }

  // Enrich class hook entries with signatures/descriptions from their typed `hooks: FooHooks` declaration.
  for (const h of allHooks) {
    if (h.sourceKind !== "class") continue;
    if (!h.hooksTypeRef) continue;
    const byHook = hookTypeDefs.get(h.hooksTypeRef);
    const def = byHook?.get(h.hook);
    if (!def) continue;
    if (h.typeArgs.length === 0 && def.typeArgs.length > 0) {
      h.typeArgs = def.typeArgs;
    }
    if (!h.description && def.description) {
      h.description = def.description;
    }
  }

  const mdx = renderMDX(allHooks);
  const outFile = path.resolve(repoRoot, args.out);

  if (args.check) {
    let existing = "";
    try {
      existing = await fs.readFile(outFile, "utf8");
    } catch {
      // missing file => fail check
    }

    if (existing !== mdx) {
      console.error(
        `Hooks docs are out of date: ${path.relative(repoRoot, outFile)}\n` +
          `Run: node scripts/docs/generate-hooks-docs.mjs --out ${path
            .relative(repoRoot, outFile)
            .replaceAll(path.sep, "/")}\n`,
      );
      process.exitCode = 1;
      return;
    }

    console.log(
      `Hooks docs are up to date: ${path.relative(repoRoot, outFile)}`,
    );
    return;
  }

  await fs.mkdir(path.dirname(outFile), { recursive: true });
  await fs.writeFile(outFile, mdx, "utf8");

  console.log(
    `Generated hooks docs: ${path.relative(repoRoot, outFile)} (${allHooks.length} hook entries scanned)`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
