load("@rules_cc//cc:defs.bzl", "cc_binary", "cc_library", "cc_test")

cc_library(
    name = "lib",
    srcs = [
        "hello-world.cpp",
    ],
    hdrs = [
        "hello-world.hpp",
    ],
    deps = ["@hermes//:host"],
)

cc_binary(
    name = "hello",
    srcs = ["hello-world.main.cpp"],
    deps = [":lib"],
)

cc_test(
    name = "test",
    size = "small",
    srcs = ["hello-world.test.cpp"],
    deps = [
        ":lib",
        "@googletest//:gtest_main",
    ],
)
