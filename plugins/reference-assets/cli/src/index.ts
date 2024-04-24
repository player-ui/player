import { LSPAssetsPlugin } from "@player-tools/cli";
import path from "path";

export default new LSPAssetsPlugin({
  path: path.join(require.resolve("@player-ui/types"), ".."),
});
