load("//:index.bzl", "javascript_pipeline")

javascript_pipeline(
    name = "@player-ui/partial-match-fingerprint-plugin",
    dependencies = [
        "@npm//tapable-ts",
    ],
    peer_dependencies = [
        "//core/player:@player-ui/player",
    ],

    test_data = [
        "//core/make-flow:@player-ui/make-flow",
    ],
    library_name = "PartialMatchFingerprintPlugin"
)
