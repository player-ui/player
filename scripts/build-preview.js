/**
 * Auto plugin that comments on PRs for releases
 */
class BuildPreviewPlugin {
  constructor() {
    this.name = "release-comment";
  }

  /**
   * Apply the plugin to the Auto instance
   */
  apply(auto) {
    // Handle canary releases through afterShipIt hook
    auto.hooks.afterShipIt.tap(this.name, async (release) => {
      const { newVersion, context: releaseContext } = release;

      if (!newVersion) {
        auto.logger.verbose.info(
          "No release version produced, skipping canary docs comment",
        );
        return;
      }

      auto.logger.verbose.info(
        `Processing ${releaseContext} release with version ${newVersion}`,
      );

      // Only handle canary releases
      if (releaseContext !== "canary") {
        auto.logger.verbose.info(
          `Skipping canary docs comment - release context is ${releaseContext}`,
        );
        return;
      }

      // Get PR number - extract from CIRCLE_PULL_REQUEST like in release.sh
      // eslint-disable-next-line no-undef
      const circlePullRequest = process.env.CIRCLE_PULL_REQUEST;
      const prNumber = circlePullRequest
        ? circlePullRequest.split("/").pop()
        : null;

      // Debug logging
      auto.logger.verbose.info(
        `CIRCLE_PULL_REQUEST: ${circlePullRequest}, extracted PR number: ${prNumber}`,
      );

      if (!prNumber) {
        auto.logger.verbose.info(
          "No PR number found in CIRCLE_PULL_REQUEST, skipping canary docs comment",
        );
        return;
      }

      auto.logger.verbose.info(
        `Commenting on PR #${prNumber} for canary release ${newVersion}`,
      );

      try {
        // Get current date
        const currentDate = new Date().toUTCString();

        // Get PR number for docs URL
        const docsUrl = `https://player-ui.github.io/pr/${prNumber}/`;

        // Comment on the PR with unified context
        let versionMessage = `### Build Preview\n\n`;
        versionMessage += `Canary version updated on \`${currentDate}\`:\n\n`;

        versionMessage += "```\n";
        versionMessage += `${newVersion}\n`;
        versionMessage += "```\n\n";

        versionMessage += `🚀 Docs preview: ${docsUrl}\n`;

        await auto.comment({
          message: versionMessage,
          context: "build-preview",
        });

        auto.logger.verbose.info("Successfully posted canary docs comment");
      } catch (error) {
        // Log the error but don't let it fail the build
        auto.logger.verbose.info(
          "Error posting canary docs comment (continuing build):",
        );
        if (error instanceof Error) {
          auto.logger.verbose.info(error.message);
        } else {
          auto.logger.verbose.info(String(error));
        }

        // Don't re-throw the error - let the build continue
        auto.logger.verbose.info(
          "Comment posting failed but continuing with release",
        );
      }
    });
  }
}

export default BuildPreviewPlugin;
