#!/usr/bin/env node

import { createRequire } from "module";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { getPackage } from "./tools/get-package.js";
import { searchApi } from "./tools/search-api.js";
import { detectPackages } from "./tools/detect-packages.js";
import { listPackages } from "./tools/list-packages.js";
import {
  validateGetPackageArgs,
  validateSearchApiArgs,
  validateDetectPackagesArgs,
  validateListPackagesArgs,
} from "./validation.js";
import { getCategories } from "./loader.js";
import { getLogger } from "./logger.js";

const require = createRequire(import.meta.url);
const { version } = require("../package.json") as { version: string };

const logger = getLogger();

export async function buildToolDefinitions(): Promise<Tool[]> {
  const categories = await getCategories();

  return [
    {
      name: "player_get_package",
      description:
        "Retrieve knowledge artifact for a specific Player UI package. " +
        "By default, includes knowledge for all dependencies up to depth 2. " +
        "Use this when you need detailed information about a package's APIs, concepts, patterns, and usage.",
      inputSchema: {
        type: "object",
        properties: {
          package: {
            type: "string",
            description:
              "The package name (e.g., '@player-ui/player', '@player-ui/react')",
          },
          includeDependencies: {
            type: "boolean",
            description:
              "Whether to include knowledge for dependencies (default: true)",
            default: true,
          },
        },
        required: ["package"],
      },
    },
    {
      name: "player_search_api",
      description:
        "Search for Player UI packages by concept, API name, or keyword. " +
        "Returns a list of matching packages with relevance information. " +
        "Use this when you're looking for packages that provide specific functionality.",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "Search query (e.g., 'validation', 'ReactPlayer', 'data binding')",
          },
          scope: {
            type: "string",
            enum: categories,
            description: `Limit search to specific package category (default: 'all'). Available: ${categories.join(", ")}`,
            default: "all",
          },
        },
        required: ["query"],
      },
    },
    {
      name: "player_detect_packages",
      description:
        "Auto-detect Player UI packages from a package.json file and retrieve quick reference. " +
        "Scans dependencies, devDependencies, and peerDependencies. " +
        "Provides overview of each detected package. " +
        "Use this when starting work in a Player UI project to understand which packages are available.",
      inputSchema: {
        type: "object",
        properties: {
          packageJsonPath: {
            type: "string",
            description: "Path to package.json file (default: 'package.json')",
            default: "package.json",
          },
        },
      },
    },
    {
      name: "player_list_packages",
      description:
        "List all available Player UI packages with descriptions and metadata. " +
        "Optionally filter by category (core, platform, plugins). " +
        "Shows tags, exports, dependencies, and estimated token counts. " +
        "Use this to browse and discover available packages.",
      inputSchema: {
        type: "object",
        properties: {
          category: {
            type: "string",
            enum: categories,
            description: `Filter by package category (default: 'all'). Available: ${categories.join(", ")}`,
            default: "all",
          },
        },
      },
    },
  ];
}

// Create MCP server
const server = new McpServer(
  {
    name: "player-ui-mcp-server",
    version,
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// Handle tool list request
server.server.setRequestHandler(ListToolsRequestSchema, async () => {
  const tools = await buildToolDefinitions();
  return { tools };
});

// Handle tool execution
server.server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const startTime = Date.now();

  logger.debug("Tool request received", { tool: name, args });

  try {
    let result: string;

    switch (name) {
      case "player_get_package": {
        const validation = validateGetPackageArgs(args);
        if (!validation.success) {
          logger.warn("Validation failed", {
            tool: name,
            error: validation.error.message,
          });
          throw validation.error;
        }
        result = await getPackage(validation.data);
        break;
      }

      case "player_search_api": {
        const validation = await validateSearchApiArgs(args);
        if (!validation.success) {
          logger.warn("Validation failed", {
            tool: name,
            error: validation.error.message,
          });
          throw validation.error;
        }
        result = await searchApi(validation.data);
        break;
      }

      case "player_detect_packages": {
        const validation = validateDetectPackagesArgs(args);
        if (!validation.success) {
          logger.warn("Validation failed", {
            tool: name,
            error: validation.error.message,
          });
          throw validation.error;
        }
        result = await detectPackages(validation.data);
        break;
      }

      case "player_list_packages": {
        const validation = await validateListPackagesArgs(args);
        if (!validation.success) {
          logger.warn("Validation failed", {
            tool: name,
            error: validation.error.message,
          });
          throw validation.error;
        }
        result = await listPackages(validation.data);
        break;
      }

      default:
        logger.error("Unknown tool requested", { tool: name });
        throw new Error(`Unknown tool: ${name}`);
    }

    const duration = Date.now() - startTime;
    logger.info("Tool request completed", { tool: name, duration });

    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    logger.error("Tool request failed", {
      tool: name,
      duration,
      error: errorMessage,
    });

    return {
      content: [
        {
          type: "text",
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server with stdio transport
async function main() {
  logger.info("Starting Player UI MCP Server");

  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info("Player UI MCP Server running on stdio");
}

main().catch((error) => {
  logger.error("Fatal server error", {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
  console.error("Fatal error:", error);
  process.exit(1);
});
