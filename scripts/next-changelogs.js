import { execSync } from "child_process";

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
          `Dry run: making changelog from last release: ${latest}`,
        );
      } else {
        await auto.changelog({
          from: second,
          to: latest,
          title: `${latest}`,
        });
        // Push to the branch being released, not baseBranch. version-* branches
        // cut their own prereleases and must not write changelogs onto main.
        const branch = execSync("git symbolic-ref --short HEAD", {
          encoding: "utf8",
        }).trim();
        execSync(`git push ${auto.remote} ${branch}`);
      }
    });
  }
}

export default NextChangelogsPlugin;
