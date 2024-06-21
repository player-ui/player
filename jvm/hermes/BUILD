load("//jvm:defs.bzl", "kt_player_module")
load(":deps.bzl", "main_deps", "main_exports", "main_resources", "test_deps")

kt_player_module(
    name = "hermes",
    main_deps = main_deps,
    main_exports = main_exports,
    main_resource_strip_prefix = "jvm/hermes/src/main/jni",
    main_resources = main_resources + glob(["src/main/resources/**"]),
    test_deps = test_deps,
    test_package = "com.intuit.playerui.hermes.bridge.runtime",
)

java_library(
    name = "fbjni",
    resource_strip_prefix = "external/fbjni",
    resources = ["@fbjni"],
)

java_binary(
    name = "app",
    main_class = "com.intuit.playerui.hermes.bridge.runtime.HermesRuntimeKt",
    runtime_deps = [
        ":fbjni",
        ":hermes",
    ],
)
