load("//:index.bzl", "javascript_pipeline")

javascript_pipeline(
    name = "@player-ui/react-subscribe",
    entry = "src/index.tsx",
    dependencies = [
        "@npm//p-defer",
    ],
    peer_dependencies = [
        "@npm//@types/react",
        "@npm//react",
    ],
)
