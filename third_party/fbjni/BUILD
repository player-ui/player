load("@rules_foreign_cc//foreign_cc:defs.bzl", "cmake")
#load("@build_constants//:constants.bzl", "JAVA_HOME")
#load("@player//third_party/fbjni:java_home.bzl", "java_home")

filegroup(
    name = "working_directory",
    srcs = glob(["**"]),
)

cmake(
    name = "host",
    cache_entries = {
        # JAVA_HOME: "$(JAVABASE)",
        "JAVA_HOME": "/Users/jzucker/.sdkman/candidates/java/current",  # TODO: This won't work
        "CMAKE_BUILD_TYPE": "Release",
        "FBJNI_SKIP_TESTS": "true",
    },
    generate_args = ["-G Ninja"],
    lib_name = "fbjni",
    lib_source = "working_directory",
    out_shared_libs = ["libfbjni.dylib"],
    visibility = ["//visibility:public"],
)

cmake(
    name = "android",
    cache_entries = {
        "ANDROID_ABI": "True",
        "CMAKE_BUILD_TYPE": "Release",
        "FBJNI_SKIP_TESTS": "true",
    },
    generate_args = ["-G Ninja"],
    lib_name = "fbjni",
    lib_source = "working_directory",
    out_shared_libs = ["libfbjni.dylib"],
    visibility = ["//visibility:public"],
)

alias(
    name = "fbjni",
    actual = "fbjni_host",
    visibility = ["//visibility:public"],
)
