load("//jvm:build.bzl", "kt_player_module")
load(":deps.bzl", "main_deps", "main_exports", "main_resources", "test_deps")

kt_player_module(
    name = "graaljs",
    main_deps = main_deps,
    main_exports = main_exports,
    main_resources = main_resources + glob(["src/main/resources/**"]),
    test_deps = test_deps,
    test_package = "com.intuit.player.jvm.graaljs",
)
