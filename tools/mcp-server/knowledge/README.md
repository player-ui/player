# Player UI Knowledge System

Model-optimized knowledge artifacts for Player UI packages, designed for consumption by Large Language Models (LLMs).

## Purpose

This knowledge system provides concise, comprehensive documentation specifically tailored for AI assistants working with Player UI codebases. Unlike traditional documentation aimed at human developers, these artifacts:

- **Focus on concepts and patterns** rather than exhaustive API listings
- **Emphasize "why" and "when"** alongside "what" and "how"
- **Structure information for LLM comprehension** using consistent markdown formatting
- **Include common pitfalls and gotchas** learned from real-world usage
- **Provide context-efficient knowledge** (1500-2000 tokens per package)

## Metadata Schema

`metadata.json` contains:

- **packages**: Catalog of all documented packages with:
  - Dependencies and dependency graph
  - Exported APIs for search
  - Tags for categorization
  - Estimated token counts
  - Knowledge file paths
- **dependencyGraph**: Resolved dependency tree with depth information
- **searchIndex**: Keyword-to-package mapping for concept search

## Knowledge Artifact Format

Each `.md` file follows this structure:

### 1. Overview (2-3 sentences)

Purpose, when to use, relationship to other packages.

### 2. Core Concepts

Key abstractions and mental models. Focus on understanding, not implementation details.

### 3. API Surface

Primary exports organized by category. Brief descriptions emphasizing purpose and typical usage.

### 4. Common Usage Patterns

Pattern-based guidance for typical tasks:

- **When to use**: Context for applying the pattern
- **Approach**: High-level steps
- **Considerations**: Gotchas, dependencies, edge cases

### 5. Dependencies

Direct dependencies with semantic descriptions of why they're needed.

### 6. Integration Points

How this package connects with others, extension points, plugin systems.

### 7. Common Pitfalls

Mistakes developers make, non-obvious edge cases, debugging hints.

### 8. Reference Files

Absolute paths to key source files for deep dives.

## Using the Knowledge System

### For Claude Code (via MCP Server)

The recommended way to use these knowledge artifacts is through the `@player-ui/mcp-server` package:

```json
// In Claude Code settings (.claude/config.json)
{
  "mcpServers": {
    "player-ui": {
      "command": "npx",
      "args": ["@player-ui/mcp-server"]
    }
  }
}
```

The MCP server provides four tools:

1. **player_get_package**: Retrieve knowledge for specific package (with automatic dependency resolution)
2. **player_search_api**: Find packages by concept/API search
3. **player_detect_packages**: Auto-detect Player UI packages from package.json
4. **player_list_packages**: List all available packages with metadata and filtering options

## Contributing Knowledge Artifacts

When Player UI APIs change or new packages are added:

### 1. Update Existing Artifacts

If API changes are minor:

- Update affected sections (API Surface, Common Pitfalls)
- Keep focus on patterns, not exhaustive listings
- Maintain 1500-2000 token budget

### 2. Create New Artifacts

For new packages:

1. **Analyze the package**:
   - Read main exports and types
   - Understand core concepts and patterns
   - Identify common usage scenarios
   - Document integration points

2. **Follow the template structure** (see above)

3. **Update metadata.json**:
   - Add package entry with dependencies
   - Update dependencyGraph
   - Add relevant searchIndex entries
   - Estimate token count

4. **Test with LLM**:
   - Ask Claude questions about the package
   - Verify knowledge artifact answers questions accurately
   - Refine based on gaps or confusion

### Writing Guidelines

**DO**:

- Focus on semantic meaning and "why"
- Use pattern-based examples
- Include common pitfalls from real usage
- Keep token count between 1500-2000
- Reference source files for details
- Use consistent markdown structure

**DON'T**:

- List every API method exhaustively
- Include implementation details
- Copy-paste API signatures verbatim
- Exceed 2000 tokens (context efficiency matters)
- Use overly casual language
- Assume LLM has knowledge of previous conversations

### Validation

Before committing changes:

1. **Token count**: Verify artifact is 1500-2000 tokens
2. **Completeness**: Check all sections present
3. **Accuracy**: Verify against source code
4. **Usefulness**: Can LLM answer common questions?
5. **Metadata**: Update metadata.json dependencies and search index

## Relationship to Traditional Documentation

These knowledge artifacts **complement but don't replace** traditional documentation:

| Knowledge Artifacts | Traditional Docs  |
| ------------------- | ----------------- |
| LLM-optimized       | Human-optimized   |
| Concept-focused     | Comprehensive     |
| Pattern-based       | Reference-based   |
| 1500-2000 tokens    | Unlimited length  |
| "Why" and "when"    | "How" and "what"  |
| Common patterns     | All possibilities |

**Use knowledge artifacts for**: AI assistance, quick onboarding, pattern discovery
**Use traditional docs for**: Deep dives, complete API reference, tutorials

## Future Enhancements

Planned improvements to the knowledge system:

- **Plugin knowledge artifacts**: Document common Player UI plugins
- **Pattern guides**: Cross-cutting patterns (creating-plugins.md, custom-assets.md)
- **RAG integration**: Semantic search over knowledge base
- **Version support**: Multiple Player UI versions in parallel
- **CI validation**: Automated checks for knowledge accuracy
- **Usage analytics**: Track which knowledge is most requested
- **Auto-update detection**: Flag when source APIs change significantly

## Questions or Issues?

If knowledge artifacts don't answer your question or contain inaccuracies:

1. **Check source code**: Reference Files section points to implementations
2. **Open an issue**: Report gaps or errors in knowledge coverage
3. **Contribute improvements**: Submit PRs to enhance artifacts
