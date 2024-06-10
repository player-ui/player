cc_library(
    name = "lib",
    srcs = [
        "hello-world.cpp",
    ],
    hdrs = [
        "hello-world.hpp",
    ],
    deps = ["@hermes"],
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
