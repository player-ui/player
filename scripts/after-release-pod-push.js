/* eslint-disable no-restricted-syntax */
/* eslint-disable no-unused-vars */
/* eslint-disable no-await-in-loop */
const { execSync } = require('child_process');

class AfterReleasePodPush {
  name = 'after-release-pod-push';

  apply(auto) {
    auto.hooks.afterRelease.tapPromise(this.name, async ({ dryRun }) => {
      if (dryRun) {
        auto.logger.log.info(`Dry run: would have pushed pod to trunk`);
      } else {
        execSync('bazel run --config=release //:PlayerUI_Pod_Push')
      }
    });
  }
}

module.exports = AfterReleasePodPush;
