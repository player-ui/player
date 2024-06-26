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

        # NOTE: This is to fix a compilation issue with NDEBUG
        "HERMES_SLOW_DEBUG": "OFF",
    },
    # NOTE: This does actually have _some_ effect, but it doesn't skip defining ASSERT_ON_DANGLING_VM_REFS
    #       as I was actually expecting.... :(
    copts = ["-DNDEBUG"],

    # NOTE: This might actually be needed for compiles down the road?
    defines = ["NDEBUG"],
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
