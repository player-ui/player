import type { PlayerConfigFileShape } from "@player-tools/cli";
import { LSPAssetsPlugin } from "@player-tools/cli";
import path from "path";

const config: PlayerConfigFileShape = {
  plugins: [
    new LSPAssetsPlugin({
      path: path.dirname(require.resolve("@player-ui/types/package.json")),
    }),
    new LSPAssetsPlugin({
      path: path.dirname(
        require.resolve("@player-ui/reference-assets-plugin/package.json"),
      ),
    }),
  ],
};

export default config;
