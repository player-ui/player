import { writeFile } from "fs/promises";

const VERSION_FILE = "./VERSION";

/**
 * After the auto release (web and android), the ios release process
 * needs to know the canary or stable version too. Write it to VERSION.
 *
 * The pipeline should ensure not to commit this change. Right now,
 * this script happens at the very end of release and this temporary
 * VERSION is automatically discarded
 */
class IosVersionPlugin {
  name = "ios-version";

  apply(auto) {
    auto.hooks.afterShipIt.tapPromise(this.name, async (release) => {
      const { newVersion, context: releaseContext } = release;

      if (!newVersion) {
        return;
      }

      if (releaseContext === "canary" || releaseContext === "next") {
        auto.logger.verbose.info(
          `Writing ${newVersion} to ${VERSION_FILE} for iOS publish`,
        );
        await writeFile(VERSION_FILE, newVersion);
      }
    });
  }
}

export default IosVersionPlugin;
