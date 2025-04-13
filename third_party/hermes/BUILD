load("@build_constants//:constants.bzl", "VERSION")
load("@rules_foreign_cc//foreign_cc:defs.bzl", "cmake")

filegroup(
    name = "working_directory",
    srcs = glob(["**"]),
)

cmake(
    name = "host",
    cache_entries = {
        "HERMES_BUILD_APPLE_FRAMEWORK": "OFF",
        "CMAKE_BUILD_TYPE": "$CMAKE_BUILD_TYPE",
    },
    env = {
        "CMAKE_BUILD_TYPE": "$(CMAKE_BUILD_TYPE)",
        "CMAKE_BUILD_PARALLEL_LEVEL": "4"
    },
    generate_args = ["-G Ninja"],
    lib_name = "hermes",
    lib_source = "working_directory",
    out_shared_libs = select({
        "@bazel_tools//src/conditions:darwin": [
            "libhermes.dylib",
            "libjsi.dylib",
        ],
        "//conditions:default": [
            "libhermes.so",
            "libjsi.so",
        ],
    }),

    # NOTE: Uses vars set by build script from rule to "install" JSI lib
    postfix_script = select({
        "@bazel_tools//src/conditions:darwin": "cp -L $BUILD_TMPDIR/jsi/libjsi.dylib $INSTALLDIR/lib",
        "//conditions:default": "cp -L $BUILD_TMPDIR/jsi/libjsi.so $INSTALLDIR/lib",
    }),
    toolchains = ["@player//:cmake_build_type"],
    visibility = ["//visibility:public"],
)

## TODO: Configure x-compiling to enable diverging from pre-built RN hermes
## Hermes X-compile requires two steps:
## 1. Compile hermesc against host
cmake(
    name = "hermesc",
    generate_args = ["-G Ninja"],
    install = False,
    lib_source = "working_directory",
    out_binaries = ["hermesc"],
    postfix_script = "cp -L $BUILD_TMPDIR/bin/hermesc $INSTALLDIR/bin",
    tags = ["no-sandbox"],
    targets = ["hermesc"],
    # Specifically build for host, always
    toolchains = ["@bazel_tools//tools/cpp:toolchain"],
)

## 2. X-compile hermes for Android referencing host built hermesc
cmake(
    name = "android",
    cache_entries = {
        "CMAKE_BUILD_TYPE": "$CMAKE_BUILD_TYPE",
        "HERMES_IS_ANDROID": "True",
        "IMPORT_HERMESC": "$(location :hermesc)",  # TODO: Link unproven since I couldn't figure out host compile
        "HERMES_BUILD_SHARED_JSI": "True",
        "HERMES_RELEASE_VERSION": "for Player {}".format(VERSION),
        #        "HERMES_ENABLE_INTL": "True",
        "CMAKE_PREFIX_PATH": "./",
    },
    copts = [
        "-O3",
        # These are the important NDK flags
        "-DANDROID_USE_LEGACY_TOOLCHAIN_FILE=ON",
        "-DANDROID_STL=c++_shared",
        "-DANDROID_PIE=True",
    ],
    env = {
        "CMAKE_BUILD_TYPE": "$(CMAKE_BUILD_TYPE)",
    },
    generate_args = ["-G Ninja"],
    lib_name = "hermes",
    lib_source = "working_directory",
    linkopts = ["-lc++_shared"],
    out_shared_libs = [
        "libhermes.so",
        "libjsi.so",  # TODO: Might not be produced
    ],
    # NOTE: Uses vars set by build script from rule to "install" JSI lib
    postfix_script = "cp -L $BUILD_TMPDIR/jsi/libjsi.so $INSTALLDIR/lib",
    tags = ["no-sandbox"],
    toolchains = ["@player//:cmake_build_type"],
    visibility = ["//visibility:public"],
    deps = [
        ":hermesc",
        "@fbjni",
    ],
)
