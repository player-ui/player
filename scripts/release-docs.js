/**
 * Auto plugin that deploys documentation for releases
 * Handles deploying to next/, latest/, and versioned directories via afterShipIt hook
 */
class ReleaseDocsPlugin {
  constructor() {
    this.name = "release-docs";
  }

  /**
   * Apply the plugin to the Auto instance
   */
  apply(auto) {
    // Handle release docs deployment through afterShipIt hook
    auto.hooks.afterShipIt.tap(this.name, async (release) => {
      const { newVersion, context: releaseContext } = release;

      auto.logger.verbose.info(
        `ReleaseDocsPlugin: Processing ${releaseContext} release with version ${newVersion}`,
      );

      // Only handle next and latest releases (not canary)
      if (releaseContext !== "next" && releaseContext !== "latest") {
        auto.logger.verbose.info(
          `Skipping docs deployment - release context is ${releaseContext}`,
        );
        return;
      }

      // eslint-disable-next-line no-undef
      const branch = process.env.CIRCLE_BRANCH;
      if (branch !== "main") {
        auto.logger.verbose.info(
          `Skipping docs deployment - branch is ${branch}, not main`,
        );
        return;
      }

      try {
        const { execSync } = await import("child_process");
        const fs = await import("fs");

        if (releaseContext === "next") {
          // Deploy to next/
          auto.logger.verbose.info("Deploying docs to next/");
          execSync(
            `STABLE_DOCS_BASE_PATH="next" \
STABLE_ALGOLIA_SEARCH_API_KEY=$ALGOLIA_NEXT_SEARCH_API_KEY \
STABLE_ALGOLIA_SEARCH_APPID="D477I7TDXB" \
STABLE_ALGOLIA_SEARCH_INDEX="crawler_Player (Next)" \
bazel run --config=release //docs:gh_deploy -- --dest_dir "next"`,
            { stdio: "inherit" },
          );
          auto.logger.verbose.info(
            "✓ Docs deployed to: https://player-ui.github.io/next/",
          );
        } else if (releaseContext === "latest") {
          // Read VERSION file to get the major version
          const version = fs.readFileSync("VERSION", "utf8").trim();
          const majorVersion = version.split(".")[0];

          auto.logger.verbose.info(
            `Deploying release docs for version ${newVersion} (major: ${majorVersion})`,
          );

          // Deploy to latest/
          auto.logger.verbose.info("Deploying docs to latest/");
          execSync(
            `STABLE_DOCS_BASE_PATH="latest" \
STABLE_ALGOLIA_SEARCH_API_KEY=$ALGOLIA_SEARCH_API_KEY \
STABLE_ALGOLIA_SEARCH_APPID="OX3UZKXCOH" \
STABLE_ALGOLIA_SEARCH_INDEX="player-ui" \
bazel run --config=release //docs:gh_deploy -- --dest_dir "latest"`,
            { stdio: "inherit" },
          );
          auto.logger.verbose.info(
            "✓ Docs deployed to: https://player-ui.github.io/latest/",
          );

          // Deploy to versioned folder (e.g., "7/")
          auto.logger.verbose.info(
            `Deploying versioned docs to ${majorVersion}/`,
          );
          execSync(
            `STABLE_DOCS_BASE_PATH="${majorVersion}" \
STABLE_ALGOLIA_SEARCH_API_KEY=$ALGOLIA_SEARCH_API_KEY \
STABLE_ALGOLIA_SEARCH_APPID="OX3UZKXCOH" \
STABLE_ALGOLIA_SEARCH_INDEX="player-ui" \
bazel run --config=release //docs:gh_deploy -- --dest_dir "${majorVersion}"`,
            { stdio: "inherit" },
          );
          auto.logger.verbose.info(
            `✓ Versioned docs deployed to: https://player-ui.github.io/${majorVersion}/`,
          );
        }

        auto.logger.verbose.info(
          `Successfully deployed ${releaseContext} docs via afterShipIt`,
        );
      } catch (error) {
        // Log the error and re-throw to fail the release if docs deployment fails
        auto.logger.verbose.error("Error deploying docs:");
        if (error instanceof Error) {
          auto.logger.verbose.error(error.message);
        } else {
          auto.logger.verbose.error(String(error));
        }

        throw new Error(
          `Docs deployment failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    });
  }
}

export default ReleaseDocsPlugin;
