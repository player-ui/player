/* eslint-disable no-restricted-syntax */
/* eslint-disable no-unused-vars */
/* eslint-disable no-await-in-loop */
const { execSync } = require('child_process');

const getTags = () => {
  const tags = execSync('git tag --sort=-creatordate', { encoding: 'utf8' });
  return tags
    .split('\n')
    .map((t) => t.trim())
    .filter((tag) => tag.includes('-next.'));
};

class DeleteOldPrereleasePlugin {
  name = 'delete-old-prerelease';

  apply(auto) {
    auto.hooks.next.tapPromise(this.name, async ({ dryRun }) => {
      const existingGitTags = getTags();

      for (const tag of existingGitTags) {
        if (dryRun) {
          auto.logger.log.info(`Dry run: would delete release for tag: ${tag}`);
        } else {
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
        }
      }
    });
  }
}

module.exports = DeleteOldPrereleasePlugin;
