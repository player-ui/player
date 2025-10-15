/* eslint-disable no-undef */

/**
 * Algolia search configurations for different deployment targets
 */
const ALGOLIA_CONFIGS = {
  // Preview/next builds use the "Next" search index
  preview: {
    apiKey: process.env.ALGOLIA_NEXT_SEARCH_API_KEY,
    appId: "D477I7TDXB",
    index: "crawler_Player (Next)",
  },
  // Production builds (latest/versioned) use the main index
  production: {
    apiKey: process.env.ALGOLIA_SEARCH_API_KEY,
    appId: "OX3UZKXCOH",
    index: "player-ui",
  },
};

/**
 * Get the environment variables needed for a docs deployment
 * @param {string} destDir - The destination directory (e.g., "next", "latest", "pr/123")
 * @param {'preview'|'production'} algoliaConfig - Which Algolia config to use
 * @returns {Object} Environment variables to set
 */
export function getDocsEnvVars(destDir, algoliaConfig = "preview") {
  const config = ALGOLIA_CONFIGS[algoliaConfig];
  if (!config) {
    throw new Error(`Unknown algolia config: ${algoliaConfig}`);
  }

  return {
    STABLE_DOCS_BASE_PATH: destDir,
    STABLE_ALGOLIA_SEARCH_API_KEY: config.apiKey,
    STABLE_ALGOLIA_SEARCH_APPID: config.appId,
    STABLE_ALGOLIA_SEARCH_INDEX: config.index,
  };
}

/**
 * Build the Bazel command to deploy docs
 * @param {string} destDir - The destination directory (e.g., "next", "latest", "pr/123")
 * @param {'preview'|'production'} algoliaConfig - Which Algolia config to use
 * @param {string} [versionOverride] - Optional version to write to VERSION file (for PR previews only)
 * @returns {string} The complete command to execute
 */
export function buildDocsDeployCommand(
  destDir,
  algoliaConfig = "preview",
  versionOverride = null,
) {
  const envVars = getDocsEnvVars(destDir, algoliaConfig);

  const envString = Object.entries(envVars)
    .map(([key, value]) => `${key}="${value}"`)
    .join(" \\\n");

  // For PR previews, optionally override VERSION file for better commit messages
  // This won't be committed to the player repo - only used for gh-pages deployment
  // For releases, auto's version-file plugin has already updated VERSION
  const versionCmd = versionOverride
    ? `echo "${versionOverride}" > VERSION && `
    : "";

  return `${versionCmd}${envString} \\\nbazel run --config=release //docs:gh_deploy -- --dest_dir "${destDir}"`;
}

/**
 * Get the public URL for a deployed docs site
 * @param {string} destDir - The destination directory
 * @returns {string} The full URL
 */
export function getDocsUrl(destDir) {
  return `https://player-ui.github.io/${destDir}/`;
}

// Export ALGOLIA_CONFIGS for direct access
export { ALGOLIA_CONFIGS };

export default {
  getDocsEnvVars,
  buildDocsDeployCommand,
  getDocsUrl,
  ALGOLIA_CONFIGS,
};
