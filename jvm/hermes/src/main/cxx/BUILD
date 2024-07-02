cc_library(
    name = "lib",
    srcs = ["HermesRuntimeHolder.cpp"],
    hdrs = ["HermesRuntimeHolder.hpp"],
    copts = ["-std=c++17"],
    visibility = ["//visibility:public"],
    deps = [
        "@hermes_android//:libhermes_headers",
        # RN JSI headers do change runtime
        "@hermes_jsi//:libjsi_headers",
        # "@hermes//:libjsi_headers",
    ],
)

cc_binary(
    name = "cxx",
    srcs = ["HermesRuntimeHolder.main.cpp"],
    copts = ["-std=c++17"],
    deps = [
        "lib",
        "@hermes//:host",
    ],
)

cc_test(
    name = "unit",
    srcs = ["HermesRuntimeHolder.test.cpp"],
    copts = ["-std=c++17"],
    deps = [
        ":lib",
        "@googletest//:gtest_main",
    ],
)
