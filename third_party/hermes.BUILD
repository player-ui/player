load("@rules_foreign_cc//foreign_cc:defs.bzl", "cmake", "ninja")

filegroup(
    name = "working_directory",
    srcs = glob(["**"]),
)

cmake(
    # NOTE: This _may_ only be compatible with OSX, will need to x-compile for other platforms
    name = "hermes_osx",
    lib_name = "hermes",
    lib_source = "working_directory",
    generate_args = ["-GNinja"],
    cache_entries = {
        "HERMES_BUILD_APPLE_FRAMEWORK": "OFF",
        "CMAKE_BUILD_TYPE": "Debug",
    },
    out_shared_libs = [
        "libhermes.dylib",
        "libjsi.dylib",
    ],
    visibility = ["//visibility:public"],
    # NOTE: Uses vars set by build script from rule to "install" JSI lib
    postfix_script = "cp -L $BUILD_TMPDIR/jsi/libjsi.dylib $INSTALLDIR/lib",
)

alias(
    name = "hermes",
    actual = "hermes_osx",
)
