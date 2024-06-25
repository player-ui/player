cc_library(
    name = "lib",
    srcs = ["HermesRuntimeHolder.cpp"],
    hdrs = ["HermesRuntimeHolder.hpp"],
    copts = ["-std=c++17"],
    visibility = ["//visibility:public"],
    deps = ["@hermes"],
)

cc_binary(
    name = "cxx",
    srcs = ["HermesRuntimeHolder.main.cpp"],
    copts = ["-std=c++17"],
    deps = ["lib"],
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
