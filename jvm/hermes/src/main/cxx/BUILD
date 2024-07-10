cc_library(
    name = "lib",
    srcs = ["HermesRuntimeHolder.cpp"],
    hdrs = ["HermesRuntimeHolder.hpp"],
    visibility = ["//visibility:public"],
    deps = ["@hermes//:host"],
)

cc_binary(
    name = "cxx",
    srcs = ["HermesRuntimeHolder.main.cpp"],
    deps = ["lib"],
)

cc_test(
    name = "unit",
    srcs = ["HermesRuntimeHolder.test.cpp"],
    deps = [
        ":lib",
        "@googletest//:gtest_main",
    ],
)
