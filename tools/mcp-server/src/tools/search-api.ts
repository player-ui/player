import { searchPackages } from "../loader.js";

export interface SearchApiArgs {
  query: string;
  scope?: string;
}

/**
 * MCP Tool: player_search_api
 * Search for Player UI packages by concept, API, or keyword
 */
export async function searchApi(args: SearchApiArgs): Promise<string> {
  const { query, scope = "all" } = args;

  const results = await searchPackages(query, scope);

  if (results.length === 0) {
    return `No packages found matching "${query}" in scope "${scope}".`;
  }

  let response = `# Search Results for "${query}"\n\n`;
  response += `**Scope**: ${scope}\n`;
  response += `**Found**: ${results.length} package(s)\n\n`;

  for (const result of results) {
    response += `## ${result.name}\n`;
    response += `**Description**: ${result.description}\n`;
    response += `**Match type**: ${result.relevance}\n\n`;
  }

  response += `\n---\n\n`;
  response += `Use \`player_get_package\` to retrieve detailed knowledge for any of these packages.\n`;

  return response;
}
