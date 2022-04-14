const { execSync } = require("child_process");

const getTags = () => {
  const tags = execSync("git tag --sort=-creatordate", { encoding: "utf8" });
  return tags
    .split("\n")
    .map((t) => t.trim())
    .filter((tag) => tag.includes("-next."));
};

/**
 * @implements {import('@auto-it/core').IPlugin}
 */
class DeleteOldPrereleasePlugin {
  name = "delete-old-prerelease";

  /**
   *
   * @param {Auto} auto
   */
  apply(auto) {
    auto.hooks.next.tapPromise(this.name, async ({ dryRun }) => {
      const existingGitTags = getTags();

      for (let tag of existingGitTags) {
        if (!dryRun) {
          try {
            const ghRelease = await auto.git.github.repos.getReleaseByTag({
              owner: auto.git.options.owner,
              repo: auto.git.options.repo,
              tag,
            });

            auto.logger.log.info(`Deleting release for tag: ${tag}`);

            await auto.git.github.repos.deleteRelease({
              owner: auto.git.options.owner,
              repo: auto.git.options.repo,
              release_id: ghRelease.data.id,
            });
          } catch (e) {
            auto.logger.log.warn(
              `Failed to delete remote release for tag: ${tag}`
            );
          }

          try {
            auto.logger.log.info(`Deleting remote tag: ${tag}`);

            await auto.git.github.git.deleteRef({
              owner: auto.git.options.owner,
              repo: auto.git.options.repo,
              ref: `tags/${tag}`,
            });
          } catch (e) {
            auto.logger.log.warn(`Failed to delete remote tag: ${tag}`);
          }

          try {
            auto.logger.log.info(`Deleting local tag: ${tag}`);

            execSync(`git tag -d ${tag}`);
          } catch (e) {
            auto.logger.log.warn(`Failed to delete local tag: ${tag}`);
          }

          auto.logger.log.info(`Deleting tag: ${tag}`);
        } else {
          auto.logger.log.info(`Dry run: would delete release for tag: ${tag}`);
        }
      }
    });
  }
}

module.exports = DeleteOldPrereleasePlugin;
