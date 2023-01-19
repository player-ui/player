/* eslint-disable no-restricted-syntax */
/* eslint-disable no-unused-vars */
/* eslint-disable no-await-in-loop */
const { execSync } = require('child_process');

class AfterShipItPodPush {
  name = 'after-shipit-pod-push';

  wasCanary = false;

  apply(auto) {
    auto.hooks.canary.tap(this.name, () => {
      this.wasCanary = true
    })
    auto.hooks.afterShipIt.tapPromise(this.name, async ({ dryRun, newVersion }) => {
      if (dryRun) {
        auto.logger.log.info('Dry run: would have pushed pod to trunk');
      } else if (this.wasCanary) {
        auto.logger.log.info('[AfterShipItPodPush]: Canary not yet supported, skipping pod push.')
      } else {
        let found = false
        let attempt = 0

        while (!found && attempt < 10) {
          const { data } = await auto.git.github.repos.listReleases({owner: auto.config.owner, repo: auto.config.repo})
          const release = data.find(element => element.tag_name === newVersion)
          const { data: releaseData } = await auto.git.github.repos.getRelease({owner: auto.config.owner, repo: auto.config.repo, release_id: release.id})
          const zip = releaseData.assets.find(element => element.name === 'PlayerUI_Pod.zip' && element.state === 'uploaded')

          found = !!zip
          if (!found) {
            attempt++
            await new Promise((resolve) => {
              setTimeout(resolve, 500)
            })
          }
        }

        auto.logger.log.info('Pushing Pod to trunk')
        let process
        try {
          process = execSync('bundle exec pod trunk push --skip-tests ./bazel-bin/PlayerUI.podspec')
        } catch(e) {
          auto.logger.log.error('Pod push failed: ', process && process.stderr.toString(), e)
          throw e
        }
      }
    });
  }
}

module.exports = AfterShipItPodPush;
