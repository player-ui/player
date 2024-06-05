load("@rules_foreign_cc//foreign_cc:defs.bzl", "cmake")

filegroup(
    name = "working_directory",
    srcs = glob(["**"]),
)

cmake(
    # NOTE: This _may_ only be compatible with OSX, will need to x-compile for other platforms
    name = "hermes_osx",
    cache_entries = {
        "HERMES_BUILD_APPLE_FRAMEWORK": "OFF",
        "CMAKE_BUILD_TYPE": "Debug",
    },
    generate_args = ["-GNinja"],
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
)
