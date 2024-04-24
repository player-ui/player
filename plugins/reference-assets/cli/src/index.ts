import { LSPAssetsPlugin } from "@player-tools/cli";
// import path from "path";
export default new LSPAssetsPlugin([
    {
        // TODO: Verify this path is correct (may need ../.. per reference)
        path: require.resolve("@player-ui/reference-assets-plugin-react")
    },
    {
        path: require.resolve("@player-ui/types")
    }
]);
