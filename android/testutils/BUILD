load("//jvm:defs.bzl", "kt_player_module")
load(":deps.bzl", "main_deps", "main_exports", "main_resources")

kt_player_module(
    name = "testutils",
    main_srcs = glob(["src/main/java/**/*.kt"]),
    main_deps = main_deps,
    main_exports = main_exports,
    main_resources = main_resources,
)