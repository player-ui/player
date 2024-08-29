load("@rules_foreign_cc//foreign_cc:defs.bzl", "cmake")

cc_library(
    name = "libjsi_headers",
    hdrs = glob(["packages/react-native/ReactCommon/jsi/**/*.h"]),
    strip_include_prefix = "packages/react-native/ReactCommon/jsi",
    visibility = ["//visibility:public"],
)

filegroup(
    name = "jsi_sources",
    srcs = glob(["packages/react-native/ReactCommon/jsi/**"]),
)

# TODO: To continue down this path, we need folly and maybe more
cmake(
    name = "libjsi.so",
    generate_args = ["-G Ninja"],
    lib_name = "jsi",
    lib_source = "jsi_sources",
    out_shared_libs = ["libjsi.so"],
    visibility = ["//visibility:public"],
    #    copts = ["-std=c++_shared"],
)
