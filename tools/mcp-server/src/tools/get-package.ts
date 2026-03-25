import { loadMetadata, loadKnowledgeWithDependencies } from "../loader.js";
import { PackageNotFoundError } from "../errors.js";
import { getConfig } from "../config.js";

export interface GetPackageArgs {
  package: string;
  includeDependencies?: boolean;
}

/**
 * MCP Tool: player_get_package
 * Retrieve knowledge artifact for a specific Player UI package
 */
export async function getPackage(args: GetPackageArgs): Promise<string> {
  const { package: packageName, includeDependencies = true } = args;

  const metadata = await loadMetadata();
  if (!metadata.packages[packageName]) {
    throw new PackageNotFoundError(packageName, Object.keys(metadata.packages));
  }

  if (!includeDependencies) {
    // Just load the single package
    const knowledge = await loadKnowledgeWithDependencies(packageName, 0);
    return knowledge.get(packageName) || "";
  }

  // Load with dependencies
  const config = getConfig();
  const knowledgeMap = await loadKnowledgeWithDependencies(
    packageName,
    config.maxDependencyDepth,
  );

  // Format the response
  const packages = Array.from(knowledgeMap.keys());
  let response = `# Knowledge for ${packageName}\n\n`;

  if (packages.length > 1) {
    response += `**Includes dependencies**: ${packages.filter((p) => p !== packageName).join(", ")}\n\n`;
    response += `---\n\n`;
  }

  // Add each package's knowledge
  for (const [pkg, knowledge] of knowledgeMap.entries()) {
    if (pkg === packageName) {
      // Main package first
      response += knowledge + "\n\n";
    }
  }

  // Add dependencies after main package
  for (const [pkg, knowledge] of knowledgeMap.entries()) {
    if (pkg !== packageName) {
      response += `---\n\n`;
      response += `# Dependency: ${pkg}\n\n`;
      response += knowledge + "\n\n";
    }
  }

  return response.trim();
}
