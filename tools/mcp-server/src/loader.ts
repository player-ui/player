import { readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
  MetadataError,
  PackageNotFoundError,
  KnowledgeArtifactError,
  FileSystemError,
} from "./errors.js";
import { LRUCache } from "./cache.js";
import { getConfig } from "./config.js";
import { getLogger } from "./logger.js";

const logger = getLogger();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const KNOWLEDGE_DIR = join(__dirname, "../knowledge");

let knowledgeCache: LRUCache<string> | null = null;

function getKnowledgeCache(): LRUCache<string> {
  if (!knowledgeCache) {
    const config = getConfig();
    knowledgeCache = new LRUCache<string>(config.cacheMaxSize);
  }
  return knowledgeCache;
}

export interface Metadata {
  version: string;
  description: string;
  packages: Record<string, PackageMetadata>;
  dependencyGraph: Record<string, DependencyInfo>;
  searchIndex: Record<string, string[]>;
}

export interface PackageMetadata {
  category: string;
  tags: string[];
  dependencies: string[];
  peerDependencies?: string[];
  knowledgeFile: string;
  estimatedTokens: number;
  exports: string[];
  description: string;
}

export interface DependencyInfo {
  depth: number;
  dependents?: string[];
  requires?: string[];
}

let metadataCache: Metadata | null = null;

/**
 * Load and parse the metadata.json file from the knowledge system.
 * Results are cached after first load for performance.
 *
 * @returns {Promise<Metadata>} Parsed metadata object containing package catalog
 * @throws {Error} If metadata file cannot be read or parsed
 */
export async function loadMetadata(): Promise<Metadata> {
  if (metadataCache) {
    return metadataCache;
  }

  const metadataPath = join(KNOWLEDGE_DIR, "metadata.json");
  try {
    const content = await readFile(metadataPath, "utf-8");
    const metadata: Metadata = JSON.parse(content);
    metadataCache = metadata;
    return metadata;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      throw new FileSystemError(
        "read",
        metadataPath,
        "Knowledge metadata not found. Ensure the knowledge system is installed correctly.",
      );
    }
    throw new MetadataError("Failed to load or parse metadata.json", error);
  }
}

/**
 * Load a knowledge artifact for a specific package.
 *
 * @param {string} packageName - Package name (e.g., '@player-ui/player')
 * @returns {Promise<string>} Knowledge artifact content as markdown
 * @throws {Error} If package not found or knowledge file cannot be read
 */
export async function loadKnowledge(packageName: string): Promise<string> {
  const cache = getKnowledgeCache();

  // Check cache first
  const cached = cache.get(packageName);
  if (cached !== null) {
    logger.debug("Knowledge cache hit", { package: packageName });
    return cached;
  }

  logger.debug("Knowledge cache miss, loading from disk", {
    package: packageName,
  });

  const metadata = await loadMetadata();
  const packageInfo = metadata.packages[packageName];

  if (!packageInfo) {
    logger.warn("Package not found", {
      package: packageName,
      availablePackages: Object.keys(metadata.packages),
    });
    throw new PackageNotFoundError(packageName, Object.keys(metadata.packages));
  }

  const knowledgePath = join(KNOWLEDGE_DIR, packageInfo.knowledgeFile);
  const startTime = Date.now();

  try {
    const knowledge = await readFile(knowledgePath, "utf-8");
    const duration = Date.now() - startTime;
    const sizeKb = (knowledge.length / 1024).toFixed(2);

    logger.debug("Knowledge loaded from disk", {
      package: packageName,
      duration,
      sizeKb,
    });

    // Cache the loaded knowledge
    cache.set(packageName, knowledge);
    return knowledge;
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error("Failed to load knowledge file", {
      package: packageName,
      path: knowledgePath,
      duration,
      error: error instanceof Error ? error.message : String(error),
    });

    throw new KnowledgeArtifactError(packageName, knowledgePath, error);
  }
}

/**
 * Load knowledge for a package and its dependencies
 */
export async function loadKnowledgeWithDependencies(
  packageName: string,
  maxDepth: number = 2,
): Promise<Map<string, string>> {
  const metadata = await loadMetadata();
  const result = new Map<string, string>();
  const visited = new Set<string>();

  async function loadRecursive(
    pkgName: string,
    currentDepth: number,
  ): Promise<void> {
    if (visited.has(pkgName) || currentDepth > maxDepth) {
      return;
    }

    visited.add(pkgName);

    const packageInfo = metadata.packages[pkgName];
    if (!packageInfo) {
      return;
    }

    // Load the knowledge artifact
    const knowledge = await loadKnowledge(pkgName);
    result.set(pkgName, knowledge);

    // Load dependencies recursively
    if (packageInfo.dependencies && currentDepth < maxDepth) {
      for (const dep of packageInfo.dependencies) {
        await loadRecursive(dep, currentDepth + 1);
      }
    }
  }

  await loadRecursive(packageName, 0);
  return result;
}

/**
 * Returns the set of unique package categories from the knowledge metadata,
 * plus "all" as a wildcard. Scopes are derived at runtime so new knowledge
 * directories are picked up automatically.
 */
export async function getCategories(): Promise<string[]> {
  const metadata = await loadMetadata();
  const categories = new Set<string>();

  for (const pkg of Object.values(metadata.packages)) {
    categories.add(pkg.category);
  }

  return ["all", ...Array.from(categories).sort()];
}

/**
 * Search for packages by keyword or export
 */
export async function searchPackages(
  query: string,
  scope: string = "all",
): Promise<Array<{ name: string; description: string; relevance: string }>> {
  const metadata = await loadMetadata();
  const results: Array<{
    name: string;
    description: string;
    relevance: string;
  }> = [];
  const queryLower = query.toLowerCase();

  // First, check search index for exact concept matches
  const indexMatches = new Set<string>();
  for (const [concept, packages] of Object.entries(metadata.searchIndex)) {
    if (concept.toLowerCase().includes(queryLower)) {
      packages.forEach((pkg) => indexMatches.add(pkg));
    }
  }

  // Then search package metadata
  for (const [packageName, packageInfo] of Object.entries(metadata.packages)) {
    // Apply scope filter
    if (scope !== "all" && packageInfo.category !== scope) {
      continue;
    }

    let relevance: string | null = null;

    // Check if in search index matches
    if (indexMatches.has(packageName)) {
      relevance = "concept-match";
    }
    // Check package name
    else if (packageName.toLowerCase().includes(queryLower)) {
      relevance = "name-match";
    }
    // Check description
    else if (packageInfo.description.toLowerCase().includes(queryLower)) {
      relevance = "description-match";
    }
    // Check tags
    else if (
      packageInfo.tags.some((tag) => tag.toLowerCase().includes(queryLower))
    ) {
      relevance = "tag-match";
    }
    // Check exports
    else if (
      packageInfo.exports.some((exp) => exp.toLowerCase().includes(queryLower))
    ) {
      relevance = "export-match";
    }

    if (relevance) {
      results.push({
        name: packageName,
        description: packageInfo.description,
        relevance,
      });
    }
  }

  // Sort by relevance
  const relevanceOrder = [
    "concept-match",
    "name-match",
    "export-match",
    "tag-match",
    "description-match",
  ];

  results.sort((a, b) => {
    const aIndex = relevanceOrder.indexOf(a.relevance);
    const bIndex = relevanceOrder.indexOf(b.relevance);
    return aIndex - bIndex;
  });

  return results;
}
