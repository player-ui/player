load("@rules_foreign_cc//foreign_cc:defs.bzl", "cmake")

filegroup(
    name = "working_directory",
    srcs = glob(["**"]),
)

config_setting(
    name = "hermes_debug",
    define_values = {"HERMES_DEBUG": ""},
)

cmake(
    # NOTE: This _may_ only be compatible with OSX, will need to x-compile for other platforms
    name = "hermes_osx",
    cache_entries = {
        "HERMES_BUILD_APPLE_FRAMEWORK": "OFF",
        # TODO: Consider moving into hermes_debug select
        "CMAKE_BUILD_TYPE": "Debug",
    } | select({
        ":hermes_debug": {
            # NOTE: This is to fix a compilation issue with NDEBUG
            "HERMES_SLOW_DEBUG": "OFF",
        },
        "//conditions:default": {},
    }),
    copts = select({
        # NOTE: This is to enable debug builds
        ":hermes_debug": ["-DNDEBUG"],
        "//conditions:default": None,
    }),
    generate_args = ["-G Ninja"],
    lib_name = "hermes",
    lib_source = "working_directory",
    out_shared_libs = [
        "libhermes.dylib",
        "libjsi.dylib",
    ],
    # NOTE: Uses vars set by build script from rule to "install" JSI lib
    postfix_script = "cp -L $BUILD_TMPDIR/jsi/libjsi.dylib $INSTALLDIR/lib",
    visibility = ["//visibility:public"],
)

alias(
    name = "hermes",
    actual = "hermes_osx",
    visibility = ["//visibility:public"],
)
