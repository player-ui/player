load("//jvm:defs.bzl", "kt_player_module")
load(":deps.bzl", "main_deps", "main_exports", "test_deps")

# TODO: Sources jar for src/main/kotlin includes main/kotlin
kt_player_module(
    name = "core",
    deploy_env = [
        "@rules_kotlin//kotlin/compiler:kotlin-stdlib",
    ],
    main_deps = main_deps,
    main_exports = main_exports,
    test_deps = test_deps,
    test_package = "com.intuit.playerui.core",
)
