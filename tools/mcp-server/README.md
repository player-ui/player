# @player-ui/mcp-server

Model Context Protocol (MCP) server providing access to Player UI knowledge system for AI assistants.

## Overview

This MCP server exposes Player UI's model-optimized knowledge artifacts through four tools:

1. **player_get_package**: Retrieve detailed knowledge for a specific package
2. **player_search_api**: Search for packages by concept or keyword
3. **player_detect_packages**: Auto-detect Player UI packages from package.json
4. **player_list_packages**: Browse all available packages by category

## Installation

### From npm (when published)

```bash
npm install -g @player-ui/mcp-server
```

### From source (for development)

```bash
# In the Player UI monorepo (uses Bazel)
bazel build //tools/mcp-server:@player-ui/mcp-server
```

## Usage

This MCP server works with any MCP-compatible client (Claude Code, Cursor, Windsurf, etc.).

### Claude Code

Add to `.claude/config.json`:

```json
{
  "mcpServers": {
    "player-ui": {
      "command": "npx",
      "args": ["@player-ui/mcp-server"]
    }
  }
}
```

### Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "player-ui": {
      "command": "npx",
      "args": ["@player-ui/mcp-server"]
    }
  }
}
```

### Local development

For any MCP client, point to the built output (`.mcp.json`):

```json
{
  "mcpServers": {
    "player-ui": {
      "command": "node",
      "args": ["/absolute/path/to/player/tools/mcp-server/dist/index.mjs"]
    }
  }
}
```

## MCP Tools

### player_get_package

Retrieve comprehensive knowledge for a Player UI package.

**Parameters**:

- `package` (required): Package name (e.g., `@player-ui/player`)
- `includeDependencies` (optional): Include dependency knowledge (default: `true`)

**Returns**: Markdown document with:

- Core concepts and architecture
- API surface documentation
- Common usage patterns
- Integration points
- Common pitfalls
- Reference file paths

**Example**:

```typescript
// Claude will automatically call:
player_get_package({
  package: "@player-ui/react",
  includeDependencies: true,
});
```

**Dependency Resolution**:
When `includeDependencies: true`, automatically includes knowledge for:

- Direct dependencies (depth 1)
- Transitive dependencies (depth 2)

For example, `@player-ui/react` includes:

- `@player-ui/react` (primary)
- `@player-ui/player` (direct dependency)
- `@player-ui/types` (direct dependency)

### player_search_api

Search for packages by concept, API name, or keyword.

**Parameters**:

- `query` (required): Search term (e.g., "validation", "hooks", "data binding")
- `scope` (optional): Limit to category: `"all"`, `"core"`, `"platform"` (default: `"all"`)

**Returns**: List of matching packages with:

- Package name
- Description
- Match relevance (concept, name, export, tag, or description match)

**Example**:

```typescript
// Search for validation-related packages
player_search_api({
  query: "validation",
  scope: "core",
});
```

**Search Strategy**:

1. **Concept match**: Query matches search index keywords (highest relevance)
2. **Name match**: Query in package name
3. **Export match**: Query in exported APIs
4. **Tag match**: Query in package tags
5. **Description match**: Query in package description

### player_detect_packages

Auto-detect Player UI packages in a project.

**Parameters**:

- `packageJsonPath` (optional): Path to package.json (default: `"package.json"`)

**Returns**:

- List of detected Player UI packages
- Quick reference (overview) for each package
- Suggestions for loading full knowledge

**Example**:

```typescript
// Detect packages in current directory
player_detect_packages({
  packageJsonPath: "package.json",
});

// Or in a subdirectory
player_detect_packages({
  packageJsonPath: "./my-app/package.json",
});
```

**Detection**:
Scans:

- `dependencies`
- `devDependencies`
- `peerDependencies`

Matches against knowledge system's package catalog.

### player_list_packages

List all available Player UI packages with metadata.

**Parameters**:

- `category` (optional): Filter by category: `"all"`, `"core"`, `"platform"` (default: `"all"`)

**Returns**:

- List of all packages grouped by category
- Package descriptions, tags, and key exports
- Dependencies and estimated token counts
- Helpful for browsing and discovering packages

**Example**:

```typescript
// List all packages
player_list_packages({
  category: "all",
});

// List only core packages
player_list_packages({
  category: "core",
});
```

## Knowledge System

The MCP server bundles knowledge artifacts in `tools/mcp-server/knowledge/` for distribution:

### Knowledge Format

Each `.md` file is optimized for LLM consumption (~1500-3000 tokens). Core sections include:

- **Overview**: Purpose and when to use
- **Core Concepts**: Key abstractions and mental models
- **API Surface**: Primary exports and interfaces
- **Common Usage Patterns**: Pattern-based guidance
- **Dependencies**: Relationship to other packages
- **Integration Points**: Extension mechanisms
- **Common Pitfalls**: Mistakes and edge cases
- **Reference Files**: Source code locations

Packages may include additional sections such as Debugging Patterns, Performance Considerations, Testing, and TypeScript Support.

### Testing

To test the MCP server manually:

1. Build the server: `bazel build //tools/mcp-server:@player-ui/mcp-server`
2. Add to your MCP client config (see above)
3. Restart your MCP client
4. Ask questions about Player UI packages

The server will log to stderr when tools are invoked.

## Configuration

The MCP server can be configured using environment variables:

| Variable              | Default | Description                                      |
| --------------------- | ------- | ------------------------------------------------ |
| `MCP_MAX_DEPTH`       | `2`     | Maximum depth for loading package dependencies   |
| `MCP_OVERVIEW_LENGTH` | `300`   | Maximum characters for overview sections         |
| `MCP_CACHE_MAX_SIZE`  | `50`    | Maximum number of entries in the knowledge cache |
| `MCP_ENABLE_PERF_LOG` | `false` | Enable performance logging to stderr             |
| `MCP_LOG_LEVEL`       | `INFO`  | Log level: `DEBUG`, `INFO`, `WARN`, or `ERROR`  |

**Example**:

```bash
# Increase cache size to 100 entries
MCP_CACHE_MAX_SIZE=100 npx @player-ui/mcp-server

# Disable dependency loading for faster responses
MCP_MAX_DEPTH=0 node dist/index.mjs
```

## Error Codes

The MCP server uses structured errors with specific error codes for better debugging:

| Code                       | Description                                         | Common Causes                                    |
| -------------------------- | --------------------------------------------------- | ------------------------------------------------ |
| `PACKAGE_NOT_FOUND`        | Requested package doesn't exist in knowledge system | Typo in package name, package not yet documented |
| `VALIDATION_ERROR`         | Invalid arguments provided to tool                  | Missing required parameter, wrong type           |
| `FILESYSTEM_ERROR`         | File operation failed                               | File not found, permission denied                |
| `PATH_TRAVERSAL`           | Attempted to access file outside allowed directory  | Security violation, malformed path               |
| `METADATA_ERROR`           | Knowledge metadata is invalid or corrupted          | Installation issue, corrupted files              |
| `KNOWLEDGE_ARTIFACT_ERROR` | Failed to load knowledge file                       | Missing knowledge file, read error               |
| `PACKAGE_JSON_ERROR`       | Failed to parse package.json                        | Invalid JSON syntax                              |

**Example error response**:

```json
{
  "content": [
    {
      "type": "text",
      "text": "Error: Package '@player-ui/nonexistent' not found in knowledge system. Available packages: @player-ui/react, @player-ui/player... Use player_search_api to find packages by keyword."
    }
  ],
  "isError": true
}
```

## Troubleshooting

### "Package X not found in knowledge system"

The package hasn't been documented yet.

To add knowledge for more packages, see `knowledge/README.md`.

### "Failed to read package.json"

Check the `packageJsonPath` parameter. Path is relative to server's CWD (usually project root).

### Server not responding

1. Check your MCP client logs for server errors
2. Verify server is built: `bazel build //tools/mcp-server:@player-ui/mcp-server`
3. Test server directly: `node dist/index.mjs` (should wait for input)

### Wrong knowledge version

Ensure MCP server version matches Player UI version. Knowledge is versioned with the monorepo.
