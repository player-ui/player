import { readFile } from "fs/promises";
import { resolve, relative, normalize } from "path";
import { detectPlayerPackages, type PackageJson } from "../detect-packages.js";
import { loadKnowledgeWithDependencies } from "../loader.js";
import {
  PathTraversalError,
  FileSystemError,
  PackageJsonError,
} from "../errors.js";
import { getConfig } from "../config.js";

export interface DetectPackagesArgs {
  packageJsonPath?: string;
}

/**
 * MCP Tool: player_detect_packages
 * Auto-detect Player UI packages from package.json and retrieve relevant knowledge
 */
export async function detectPackages(
  args: DetectPackagesArgs,
): Promise<string> {
  const { packageJsonPath = "package.json" } = args;

  let packageJsonContent: string;
  let resolvedPath: string = packageJsonPath;

  try {
    const baseDir = process.cwd();
    const normalizedPath = normalize(packageJsonPath);
    resolvedPath = resolve(baseDir, normalizedPath);
    const relativePath = relative(baseDir, resolvedPath);

    // Path traversal protection
    // 1. Check if path escapes base directory
    if (
      relativePath.startsWith("..") ||
      resolve(baseDir, relativePath) !== resolvedPath
    ) {
      throw new PathTraversalError(packageJsonPath, baseDir);
    }

    // 2. Check if resolved path actually starts with base directory (absolute path check)
    if (!resolvedPath.startsWith(baseDir)) {
      throw new PathTraversalError(packageJsonPath, baseDir);
    }

    packageJsonContent = await readFile(resolvedPath, "utf-8");
  } catch (error) {
    if (error instanceof PathTraversalError) {
      throw error;
    }
    throw new FileSystemError("read", resolvedPath, error);
  }

  let packageJson: PackageJson;
  try {
    packageJson = JSON.parse(packageJsonContent);
  } catch (error) {
    throw new PackageJsonError(resolvedPath, error);
  }

  const detectedPackages = await detectPlayerPackages(packageJson);

  if (detectedPackages.length === 0) {
    return `No Player UI packages detected in ${packageJsonPath}.`;
  }

  let response = `# Detected Player UI Packages\n\n`;
  response += `**Source**: ${packageJsonPath}\n`;
  response += `**Found**: ${detectedPackages.length} package(s)\n\n`;

  for (const pkg of detectedPackages) {
    response += `- ${pkg}\n`;
  }

  response += `\n---\n\n`;
  response += `# Quick Reference\n\n`;

  // Load quick reference (just overview section) for each package
  for (const pkg of detectedPackages) {
    try {
      const knowledgeMap = await loadKnowledgeWithDependencies(pkg, 0);
      const knowledge = knowledgeMap.get(pkg);

      if (knowledge) {
        const config = getConfig();
        // Extract just the Overview section (first few hundred chars after ## Overview)
        const overviewMatch = knowledge.match(
          /## Overview\n\n([\s\S]*?)(?=\n## |$)/,
        );
        const overview = overviewMatch
          ? overviewMatch[1].substring(0, config.overviewMaxLength).trim() +
            "..."
          : "No overview available.";

        response += `### ${pkg}\n${overview}\n\n`;
      }
    } catch (error) {
      response += `### ${pkg}\n*Knowledge artifact not available.*\n\n`;
    }
  }

  response += `\n---\n\n`;
  response += `Use \`player_get_package\` with \`package\` parameter to get full knowledge for any of these packages.\n`;

  return response;
}
