load("//jvm:build.bzl", "kt_player_module")
load(":deps.bzl", "main_deps", "main_exports", "main_resources")

kt_player_module(
    name = "testutils",
    main_deps = main_deps,
    main_exports = main_exports,
    main_resource_strip_prefix = "plugins/reference-assets/mocks",
    main_resources = main_resources,
)
