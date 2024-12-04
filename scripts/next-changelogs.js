/* eslint-disable no-restricted-syntax */
/* eslint-disable no-unused-vars */
/* eslint-disable no-await-in-loop */
const { execSync } = require("child_process");

const getLatestReleaseTag = () => {
  const tags = execSync("git tag --sort=-creatordate", { encoding: "utf8" });
  return tags
    .split("\n")
    .map((t) => t.trim())
    .filter(
      (tag) =>
        tag.includes("-next.") ||
        tag.match(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/),
    )[0];
};

class NextChangelogsPlugin {
  name = "next-changelogs";

  apply(auto) {
    auto.hooks.next.tapPromise(this.name, async ({ dryRun }) => {
      const latestRelease = getLatestReleaseTag();
      if (dryRun) {
        auto.logger.log.info(
          `Dry run: making changelog from last release: ${latestRelease}`,
        );
      } else {
        await auto.changelog({ from: latestRelease });
        execSync(`git push ${auto.remote}  ${auto.baseBranch}`);
      }
    });
  }
}

module.exports = NextChangelogsPlugin;
