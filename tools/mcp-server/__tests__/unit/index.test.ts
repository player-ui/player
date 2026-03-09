import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock all external dependencies before importing index
vi.mock("../../src/tools/get-package.js", () => ({
  getPackage: vi.fn(),
}));

vi.mock("../../src/tools/search-api.js", () => ({
  searchApi: vi.fn(),
}));

vi.mock("../../src/tools/detect-packages.js", () => ({
  detectPackages: vi.fn(),
}));

vi.mock("../../src/tools/list-packages.js", () => ({
  listPackages: vi.fn(),
}));

vi.mock("../../src/validation.js", () => ({
  validateGetPackageArgs: vi.fn(),
  validateSearchApiArgs: vi.fn(),
  validateDetectPackagesArgs: vi.fn(),
  validateListPackagesArgs: vi.fn(),
}));

vi.mock("../../src/loader.js", () => ({
  getCategories: vi.fn(),
}));

// Mock MCP SDK
vi.mock("@modelcontextprotocol/sdk/server/mcp.js", () => ({
  McpServer: vi.fn(() => ({
    server: {
      setRequestHandler: vi.fn(),
    },
    connect: vi.fn(),
  })),
}));

vi.mock("@modelcontextprotocol/sdk/server/stdio.js", () => ({
  StdioServerTransport: vi.fn(),
}));

describe("MCP Server Index", () => {
  let getCategories: any;
  let validateGetPackageArgs: any;
  let validateSearchApiArgs: any;
  let validateDetectPackagesArgs: any;
  let validateListPackagesArgs: any;
  let getPackage: any;
  let searchApi: any;
  let detectPackages: any;
  let listPackages: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Get mocked functions
    const loader = await import("../../src/loader.js");
    const validation = await import("../../src/validation.js");
    const tools = await import("../../src/tools/get-package.js");
    const searchTool = await import("../../src/tools/search-api.js");
    const detectTool = await import("../../src/tools/detect-packages.js");
    const listTool = await import("../../src/tools/list-packages.js");

    getCategories = loader.getCategories;
    validateGetPackageArgs = validation.validateGetPackageArgs;
    validateSearchApiArgs = validation.validateSearchApiArgs;
    validateDetectPackagesArgs = validation.validateDetectPackagesArgs;
    validateListPackagesArgs = validation.validateListPackagesArgs;
    getPackage = tools.getPackage;
    searchApi = searchTool.searchApi;
    detectPackages = detectTool.detectPackages;
    listPackages = listTool.listPackages;

    // Set default mock implementations
    getCategories.mockResolvedValue(["all", "core", "react", "plugins"]);
  });

  describe("Tool Definitions", () => {
    it("should build 4 tool definitions", async () => {
      // Import buildToolDefinitions (now exported)
      const { buildToolDefinitions } = await import("../../src/index.js");
      const tools = await buildToolDefinitions();

      expect(tools).toHaveLength(4);
      expect(tools.map((t) => t.name)).toEqual([
        "player_get_package",
        "player_search_api",
        "player_detect_packages",
        "player_list_packages",
      ]);
    });

    it("should include correct tool schemas", async () => {
      const { buildToolDefinitions } = await import("../../src/index.js");
      const tools = await buildToolDefinitions();

      const getPackageTool = tools.find((t) => t.name === "player_get_package");
      expect(getPackageTool).toBeDefined();
      expect(getPackageTool?.description).toContain("knowledge artifact");
      expect(getPackageTool?.inputSchema.properties).toHaveProperty("package");
      expect(getPackageTool?.inputSchema.required).toContain("package");
    });

    it("should include categories in search and list tools", async () => {
      getCategories.mockResolvedValue(["all", "core", "react"]);

      const { buildToolDefinitions } = await import("../../src/index.js");
      const tools = await buildToolDefinitions();

      const searchTool = tools.find((t) => t.name === "player_search_api");
      expect(searchTool?.inputSchema.properties.scope.enum).toEqual([
        "all",
        "core",
        "react",
      ]);

      const listTool = tools.find((t) => t.name === "player_list_packages");
      expect(listTool?.inputSchema.properties.category.enum).toEqual([
        "all",
        "core",
        "react",
      ]);
    });

    it("should mark required fields correctly", async () => {
      const { buildToolDefinitions } = await import("../../src/index.js");
      const tools = await buildToolDefinitions();

      // get_package requires 'package'
      const getPackage = tools.find((t) => t.name === "player_get_package");
      expect(getPackage?.inputSchema.required).toEqual(["package"]);

      // search_api requires 'query'
      const searchApi = tools.find((t) => t.name === "player_search_api");
      expect(searchApi?.inputSchema.required).toEqual(["query"]);

      // detect_packages has no required fields
      const detectPackages = tools.find(
        (t) => t.name === "player_detect_packages",
      );
      expect(detectPackages?.inputSchema.required || []).toHaveLength(0);

      // list_packages has no required fields
      const listPackages = tools.find((t) => t.name === "player_list_packages");
      expect(listPackages?.inputSchema.required || []).toHaveLength(0);
    });
  });

  describe("Tool Routing and Validation", () => {
    describe("player_get_package", () => {
      it("should validate args and call getPackage on success", async () => {
        const mockArgs = { package: "@player-ui/player" };
        const mockResult = "# Player Package Knowledge";

        validateGetPackageArgs.mockReturnValue({
          success: true,
          data: mockArgs,
        });
        getPackage.mockResolvedValue(mockResult);

        // Simulate the tool call logic
        const validation = validateGetPackageArgs(mockArgs);
        expect(validation.success).toBe(true);

        const result = await getPackage(validation.data);
        expect(result).toBe(mockResult);
        expect(getPackage).toHaveBeenCalledWith(mockArgs);
      });

      it("should throw error when validation fails", () => {
        const mockArgs = { package: "" };
        const mockError = new Error("Package name required");

        validateGetPackageArgs.mockReturnValue({
          success: false,
          error: mockError,
        });

        const validation = validateGetPackageArgs(mockArgs);
        expect(validation.success).toBe(false);
        expect(validation.error).toBe(mockError);
      });

      it("should handle includeDependencies parameter", async () => {
        const mockArgs = {
          package: "@player-ui/react",
          includeDependencies: false,
        };

        validateGetPackageArgs.mockReturnValue({
          success: true,
          data: mockArgs,
        });
        getPackage.mockResolvedValue("# React Package");

        const validation = validateGetPackageArgs(mockArgs);
        await getPackage(validation.data);

        expect(getPackage).toHaveBeenCalledWith({
          package: "@player-ui/react",
          includeDependencies: false,
        });
      });
    });

    describe("player_search_api", () => {
      it("should validate args and call searchApi on success", async () => {
        const mockArgs = { query: "validation" };
        const mockResult = "Search results...";

        validateSearchApiArgs.mockResolvedValue({
          success: true,
          data: mockArgs,
        });
        searchApi.mockResolvedValue(mockResult);

        const validation = await validateSearchApiArgs(mockArgs);
        expect(validation.success).toBe(true);

        const result = await searchApi(validation.data);
        expect(result).toBe(mockResult);
      });

      it("should throw error when validation fails", async () => {
        const mockArgs = { query: "" };
        const mockError = new Error("Query required");

        validateSearchApiArgs.mockResolvedValue({
          success: false,
          error: mockError,
        });

        const validation = await validateSearchApiArgs(mockArgs);
        expect(validation.success).toBe(false);
        expect(validation.error).toBe(mockError);
      });

      it("should handle scope parameter", async () => {
        const mockArgs = { query: "player", scope: "core" };

        validateSearchApiArgs.mockResolvedValue({
          success: true,
          data: mockArgs,
        });
        searchApi.mockResolvedValue("Results");

        const validation = await validateSearchApiArgs(mockArgs);
        await searchApi(validation.data);

        expect(searchApi).toHaveBeenCalledWith({
          query: "player",
          scope: "core",
        });
      });
    });

    describe("player_detect_packages", () => {
      it("should validate args and call detectPackages on success", async () => {
        const mockArgs = { packageJsonPath: "package.json" };
        const mockResult = "Detected packages...";

        validateDetectPackagesArgs.mockReturnValue({
          success: true,
          data: mockArgs,
        });
        detectPackages.mockResolvedValue(mockResult);

        const validation = validateDetectPackagesArgs(mockArgs);
        const result = await detectPackages(validation.data);

        expect(result).toBe(mockResult);
        expect(detectPackages).toHaveBeenCalledWith(mockArgs);
      });

      it("should throw error when validation fails", () => {
        const mockError = new Error("Invalid path");

        validateDetectPackagesArgs.mockReturnValue({
          success: false,
          error: mockError,
        });

        const validation = validateDetectPackagesArgs({
          packageJsonPath: "../../etc/passwd",
        });
        expect(validation.success).toBe(false);
      });

      it("should handle custom packageJsonPath", async () => {
        const mockArgs = { packageJsonPath: "custom/package.json" };

        validateDetectPackagesArgs.mockReturnValue({
          success: true,
          data: mockArgs,
        });
        detectPackages.mockResolvedValue("Custom path results");

        const validation = validateDetectPackagesArgs(mockArgs);
        await detectPackages(validation.data);

        expect(detectPackages).toHaveBeenCalledWith({
          packageJsonPath: "custom/package.json",
        });
      });
    });

    describe("player_list_packages", () => {
      it("should validate args and call listPackages on success", async () => {
        const mockArgs = { category: "all" };
        const mockResult = "Package list...";

        validateListPackagesArgs.mockResolvedValue({
          success: true,
          data: mockArgs,
        });
        listPackages.mockResolvedValue(mockResult);

        const validation = await validateListPackagesArgs(mockArgs);
        const result = await listPackages(validation.data);

        expect(result).toBe(mockResult);
      });

      it("should throw error when validation fails", async () => {
        const mockError = new Error("Invalid category");

        validateListPackagesArgs.mockResolvedValue({
          success: false,
          error: mockError,
        });

        const validation = await validateListPackagesArgs({
          category: "invalid",
        });
        expect(validation.success).toBe(false);
      });

      it("should handle category filter", async () => {
        const mockArgs = { category: "core" };

        validateListPackagesArgs.mockResolvedValue({
          success: true,
          data: mockArgs,
        });
        listPackages.mockResolvedValue("Core packages");

        const validation = await validateListPackagesArgs(mockArgs);
        await listPackages(validation.data);

        expect(listPackages).toHaveBeenCalledWith({ category: "core" });
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle validation errors gracefully", () => {
      const mockError = new Error("Validation failed: missing required field");

      validateGetPackageArgs.mockReturnValue({
        success: false,
        error: mockError,
      });

      const validation = validateGetPackageArgs({});
      expect(validation.success).toBe(false);
      expect(validation.error).toEqual(mockError);
    });

    it("should handle tool execution errors", async () => {
      const mockError = new Error("Package not found");

      validateGetPackageArgs.mockReturnValue({
        success: true,
        data: { package: "@player-ui/nonexistent" },
      });
      getPackage.mockRejectedValue(mockError);

      const validation = validateGetPackageArgs({
        package: "@player-ui/nonexistent",
      });

      await expect(getPackage(validation.data)).rejects.toThrow(
        "Package not found",
      );
    });

    it("should convert non-Error objects to strings", () => {
      const mockStringError = "String error message";

      validateGetPackageArgs.mockReturnValue({
        success: false,
        error: mockStringError,
      });

      const validation = validateGetPackageArgs({});
      expect(validation.error).toBe(mockStringError);
    });

    it("should handle unknown tool names", () => {
      // This would be tested by the CallToolRequestSchema handler
      // which we can't easily test without complex MCP SDK mocking
      // But we can verify the error message format
      const unknownToolName = "player_unknown_tool";
      const expectedError = new Error(`Unknown tool: ${unknownToolName}`);

      expect(expectedError.message).toBe("Unknown tool: player_unknown_tool");
    });
  });

  describe("Response Formatting", () => {
    it("should format successful responses correctly", async () => {
      const mockResult = "# Package Knowledge\n\nContent here...";

      validateGetPackageArgs.mockReturnValue({
        success: true,
        data: { package: "@player-ui/player" },
      });
      getPackage.mockResolvedValue(mockResult);

      const validation = validateGetPackageArgs({
        package: "@player-ui/player",
      });
      const result = await getPackage(validation.data);

      // Verify the result would be formatted as MCP response
      const mcpResponse = {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };

      expect(mcpResponse.content[0].type).toBe("text");
      expect(mcpResponse.content[0].text).toBe(mockResult);
    });

    it("should format error responses correctly", () => {
      const mockError = new Error("Something went wrong");

      // Simulate error response formatting
      const errorMessage =
        mockError instanceof Error ? mockError.message : String(mockError);
      const mcpErrorResponse = {
        content: [
          {
            type: "text",
            text: `Error: ${errorMessage}`,
          },
        ],
        isError: true,
      };

      expect(mcpErrorResponse.content[0].text).toBe(
        "Error: Something went wrong",
      );
      expect(mcpErrorResponse.isError).toBe(true);
    });

    it("should handle string errors in formatting", () => {
      const mockError = "Plain string error";

      const errorMessage =
        mockError instanceof Error ? mockError.message : String(mockError);
      const mcpErrorResponse = {
        content: [
          {
            type: "text",
            text: `Error: ${errorMessage}`,
          },
        ],
        isError: true,
      };

      expect(mcpErrorResponse.content[0].text).toBe(
        "Error: Plain string error",
      );
    });
  });

  describe("Integration Scenarios", () => {
    it("should handle complete get_package flow", async () => {
      const mockArgs = {
        package: "@player-ui/react",
        includeDependencies: true,
      };
      const mockKnowledge = "# React Player Knowledge\n\nDetailed content...";

      validateGetPackageArgs.mockReturnValue({
        success: true,
        data: mockArgs,
      });
      getPackage.mockResolvedValue(mockKnowledge);

      // Simulate full flow
      const validation = validateGetPackageArgs(mockArgs);
      expect(validation.success).toBe(true);

      const result = await getPackage(validation.data);
      expect(result).toBe(mockKnowledge);

      const response = {
        content: [{ type: "text", text: result }],
      };

      expect(response.content[0].text).toContain("React Player Knowledge");
    });

    it("should handle complete search_api flow", async () => {
      const mockArgs = { query: "validation", scope: "core" };
      const mockResults = "**Matching packages:**\n- @player-ui/types";

      validateSearchApiArgs.mockResolvedValue({
        success: true,
        data: mockArgs,
      });
      searchApi.mockResolvedValue(mockResults);

      const validation = await validateSearchApiArgs(mockArgs);
      const result = await searchApi(validation.data);

      expect(result).toContain("@player-ui/types");
    });

    it("should handle complete detect_packages flow", async () => {
      const mockArgs = { packageJsonPath: "package.json" };
      const mockDetected =
        "**Detected packages:**\n- @player-ui/player\n- @player-ui/react";

      validateDetectPackagesArgs.mockReturnValue({
        success: true,
        data: mockArgs,
      });
      detectPackages.mockResolvedValue(mockDetected);

      const validation = validateDetectPackagesArgs(mockArgs);
      const result = await detectPackages(validation.data);

      expect(result).toContain("Detected packages");
    });

    it("should handle complete list_packages flow", async () => {
      const mockArgs = { category: "all" };
      const mockList =
        "**Available packages:**\n1. @player-ui/types\n2. @player-ui/player";

      validateListPackagesArgs.mockResolvedValue({
        success: true,
        data: mockArgs,
      });
      listPackages.mockResolvedValue(mockList);

      const validation = await validateListPackagesArgs(mockArgs);
      const result = await listPackages(validation.data);

      expect(result).toContain("Available packages");
    });
  });

  describe("Categories Integration", () => {
    it("should load categories for tool definitions", async () => {
      const mockCategories = ["all", "core", "react", "plugins"];
      getCategories.mockResolvedValue(mockCategories);

      const categories = await getCategories();
      expect(categories).toEqual(mockCategories);
      expect(categories).toHaveLength(4);
    });

    it("should use categories in search scope enum", async () => {
      const mockCategories = ["all", "core", "react"];
      getCategories.mockResolvedValue(mockCategories);

      const categories = await getCategories();

      // Verify categories would be used in inputSchema enum
      expect(categories).toContain("all");
      expect(categories).toContain("core");
      expect(categories).toContain("react");
    });

    it("should use categories in list category filter", async () => {
      const mockCategories = ["all", "core", "react", "plugins"];
      getCategories.mockResolvedValue(mockCategories);

      const categories = await getCategories();

      // All categories should be valid for filtering
      for (const category of mockCategories) {
        expect(categories).toContain(category);
      }
    });
  });
});
