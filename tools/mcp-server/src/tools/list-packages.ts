import { loadMetadata } from "../loader.js";

export interface ListPackagesArgs {
  category?: string;
}

/**
 * MCP Tool: player_list_packages
 * List all available Player UI packages, optionally filtered by category
 */
export async function listPackages(
  args: ListPackagesArgs = {},
): Promise<string> {
  const { category = "all" } = args;
  const metadata = await loadMetadata();

  // Filter packages by category
  let packages = Object.entries(metadata.packages);
  if (category !== "all") {
    packages = packages.filter(([_, info]) => info.category === category);
  }

  let response = `# Available Player UI Packages\n\n`;
  response += `**Category Filter**: ${category}\n`;
  response += `**Total**: ${packages.length} package(s)\n\n`;

  if (packages.length === 0) {
    response += `No packages found in category "${category}".\n\n`;
    response += `Use scope "all" to see all packages, or try one of these categories:\n`;
    const categories = [
      ...new Set(Object.values(metadata.packages).map((p) => p.category)),
    ];
    categories.forEach((cat) => {
      response += `- ${cat}\n`;
    });
    return response;
  }

  // Group packages by category
  const byCategory = new Map<
    string,
    Array<[string, (typeof metadata.packages)[string]]>
  >();

  for (const [name, info] of packages) {
    if (!byCategory.has(info.category)) {
      byCategory.set(info.category, []);
    }
    byCategory.get(info.category)!.push([name, info]);
  }

  // Render grouped packages
  for (const [cat, pkgs] of byCategory) {
    response += `## ${cat.charAt(0).toUpperCase() + cat.slice(1)} Packages\n\n`;

    for (const [name, info] of pkgs) {
      response += `### ${name}\n`;
      response += `${info.description}\n\n`;
      response += `**Tags**: ${info.tags.join(", ")}\n`;

      const exportsPreview =
        info.exports.length > 5
          ? info.exports.slice(0, 5).join(", ") + "..."
          : info.exports.join(", ");
      response += `**Key Exports**: ${exportsPreview}\n`;

      if (info.dependencies.length > 0) {
        response += `**Dependencies**: ${info.dependencies.join(", ")}\n`;
      }

      response += `**Estimated Tokens**: ~${info.estimatedTokens}\n\n`;
    }
  }

  response += `---\n\n`;
  response += `Use \`player_get_package\` with the \`package\` parameter to retrieve detailed knowledge for any package.\n`;

  return response;
}
