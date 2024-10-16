import type { PlayerConfigFileShape } from "@player-tools/cli";
import { LSPAssetsPlugin } from "@player-tools/cli";
import path from "path";

const config: PlayerConfigFileShape = {
  plugins: [
    new LSPAssetsPlugin(
      ["@player-ui/types", "@player-ui/reference-assets-plugin"].map((pkg) => ({
        path: path.join(
          path.dirname(require.resolve(`${pkg}/package.json`)),
          "dist",
        ),
      })),
    ),
  ],
};

export default config;
