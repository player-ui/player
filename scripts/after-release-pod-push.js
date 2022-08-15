/* eslint-disable no-restricted-syntax */
/* eslint-disable no-unused-vars */
/* eslint-disable no-await-in-loop */
const { execSync } = require('child_process');

class AfterReleasePodPush {
  name = 'after-release-pod-push';

  apply(auto) {
    auto.hooks.afterRelease.tapPromise(this.name, async ({ dryRun, newVersion }) => {
      if (dryRun) {
        auto.logger.log.info(`Dry run: would have pushed pod to trunk`);
      } else {
        let found = false
        let attempt = 0
        while (!found && attempt < 10) {
          const { data } = await auto.git?.github.repos.listReleases({owner: auto.config.owner, repo: auto.config.repo})
          const release = data.find(element => element.name === newVersion)
          const { data: releaseData } = await auto.git?.github.repos.getRelease({owner: auto.config.owner, repo: auto.config.repo, release_id: release.id})
          const zip = releaseData.assets.find(element => element.name === 'PlayerUI_Pod.zip' && element.state == 'uploaded')

          found = !!zip
          if (!found) {
            attempt++
            await new Promise((resolve) => {
              setTimeout(resolve, 500)
            })
          }
        }
        execSync('bazel run --config=release //:PlayerUI_Pod_Push')
      }
    });
  }
}

module.exports = AfterReleasePodPush;
