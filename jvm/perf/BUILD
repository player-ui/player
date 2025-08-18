load("@rules_jvm_external//:defs.bzl", "artifact")
load("@rules_kotlin//kotlin:jvm.bzl", "kt_jvm_library")
load("//jvm:defs.bzl", "kt_player_module")

kt_player_module(
    name = "perf_tests",
    main_deps = ["//jvm/testutils"],
    main_srcs = ["src/main/kotlin/com/intuit/playerui/perf/junit/JSEngineTest.kt"],
    test_package = "com.intuit.playerui.perf",
)

java_plugin(
    name = "jmh_annotation_processor",
    processor_class = "org.openjdk.jmh.generators.BenchmarkProcessor",
    deps = [artifact("org.openjdk.jmh:jmh-generator-annprocess")],
)

kt_jvm_library(
    name = "perf_lib",
    srcs = ["src/main/kotlin/com/intuit/playerui/perf/jmh/PlayerPerf.kt"],
    kotlinc_opts = "//jvm:test_options",
    plugins = [":jmh_annotation_processor"],
    resources = glob(["src/main/resources/*.json"], allow_empty=True),
    deps = [
        "//jvm/core",
        "//jvm/graaljs",
        "//jvm/hermes:hermes-host",
        "//jvm/j2v8:j2v8-all",
        "//tools/mocks:jar",
        artifact("org.openjdk.jmh:jmh-core"),
    ],
)

# TODO: Potentially transition to ensure //:cmake_build_type is MinSizeRel
java_binary(
    name = "perf",
    main_class = "org.openjdk.jmh.Main",
    runtime_deps = [":perf_lib"],
)
