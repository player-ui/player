load("@rules_foreign_cc//foreign_cc:defs.bzl", "cmake")
#load("@build_constants//:constants.bzl", "JAVA_HOME")
#load("@player//third_party/fbjni:java_home.bzl", "java_home")

filegroup(
    name = "working_directory",
    srcs = glob(["**"]),
)

filegroup(
    name = "headers",
    srcs = glob(["cxx/**/*.h"]),
    visibility = ["//visibility:public"],
)

cmake(
    # NOTE: This _may_ only be compatible with OSX, will need to x-compile for other platforms
    name = "fbjni_osx",
    cache_entries = {
        #        "JAVA_HOME": "$(JAVA_HOME)",
        #        "JAVA_HOME": java_home("@bazel_tools//tools/jdk:current_java_runtime"),
        "JAVA_HOME": "/Users/jzucker/.sdkman/candidates/java/current",  # TODO: This won't work
        "CMAKE_BUILD_TYPE": "Debug",
        #        "CMAKE_INSTALL_MODE": "COPY",
        #        "GTEST_LIB": "@googletest",
        "FBJNI_SKIP_TESTS": "true",
    },
    #    install_args = ["install_args"]
    #    env = {
    #        "CMAKE_INSTALL_MODE": "COPY",
    #    },
    generate_args = ["-GNinja"],
    lib_name = "fbjni",
    lib_source = "working_directory",
    #    out_lib_dir = "",
    out_shared_libs = [
        "libfbjni.dylib",
    ],
    #    tags = ["no-sandbox"],
    visibility = ["//visibility:public"],
)

#cc_library(
#    name = "fbjni",
#    hdrs = [":headers"],
#    visibility = ["//visibility:public"],
#    deps = [":fbjni_osx"],
#)
#
alias(
    name = "fbjni",
    actual = "fbjni_osx",
    visibility = ["//visibility:public"],
)
