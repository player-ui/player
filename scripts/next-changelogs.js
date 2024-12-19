/* eslint-disable no-restricted-syntax */
/* eslint-disable no-unused-vars */
/* eslint-disable no-await-in-loop */
const { execSync } = require("child_process");

const getLatestReleaseTags = () => {
  const tags = execSync("git tag --sort=-creatordate", { encoding: "utf8" });
  return tags
    .split("\n")
    .map((t) => t.trim())
    .filter(
      (tag) =>
        tag.includes("-next.") ||
        tag.match(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/),
    );
};

class NextChangelogsPlugin {
  name = "next-changelogs";

  apply(auto) {
    auto.hooks.next.tapPromise(this.name, async ({ dryRun }) => {
      const [latest, second] = getLatestReleaseTags();
      if (dryRun) {
        auto.logger.log.info(
          `Dry run: making changelog from last release: ${latestRelease}`,
        );
      } else {
        await auto.changelog({
          from: second,
          to: latest,
          title: `${latest} ${new Date().toDateString()}`,
        });
        execSync(`git push ${auto.remote} ${auto.baseBranch}`);
      }
    });
  }
}

module.exports = NextChangelogsPlugin;
