load("@build_constants//:constants.bzl", "GROUP", "VERSION")
load("@rules_jvm_external//:defs.bzl", "artifact")
load("@rules_player//kotlin:defs.bzl", _kt_android = "kt_android")

DEFAULT_INSTRUMENTED_DEPS = [
    "@rules_robolectric//bazel:android-all",
    artifact("org.robolectric:robolectric")
]

def kt_android(
        *,
        name,
        group = GROUP,
        instrumented_test_deps = [],
        instrumented_test_opts = "//jvm:test_options",
        lint_config = "//jvm:lint_config",
        main_opts = "//jvm:main_options",
        unit_test_opts = "//jvm:test_options",
        version = VERSION,
        **kwargs):
    _kt_android(
        name = name,
        group = group,
        instrumented_test_deps = instrumented_test_deps + [dep for dep in DEFAULT_INSTRUMENTED_DEPS if dep not in instrumented_test_deps],
        instrumented_test_opts = instrumented_test_opts,
        lint_config = lint_config,
        main_opts = main_opts,
        unit_test_opts = unit_test_opts,
        version = version,
        **kwargs
    )

    (package, platform) = native.package_name().split("/")[-2:]
    if name == package or name == "%s-%s" % (package, platform):
        native.alias(
            name = platform,
            actual = name,
            visibility = ["//visibility:public"],
        )
