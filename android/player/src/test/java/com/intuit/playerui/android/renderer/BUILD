load("//android/player:build.bzl", "kt_player_test")
load("@io_bazel_rules_kotlin//kotlin:jvm.bzl", "kt_jvm_library")
load("//android/player:deps.bzl", "test_deps")

kt_player_test(
    name = "render-tests",
    srcs = [
        "BaseRenderableAssetTest.kt",
        "HydrationScopeTest.kt",
        "NestedAssetTest.kt",
        "SimpleAssetTest.kt",
        "//android/player/src/test/java/com/intuit/playerui/android/extensions:CoroutineTestDispatcherExtension.kt"
    ]
)

exports_files(["BaseRenderableAssetTest.kt"])

