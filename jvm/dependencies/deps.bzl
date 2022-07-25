load(":common.bzl", common = "maven")
load("//android/player:deps.bzl", android = "maven")
load("//android/demo:deps.bzl", demo = "maven")
load("//jvm/core:deps.bzl", core = "maven")
load("//jvm/graaljs:deps.bzl", graaljs = "maven")
load("//jvm/j2v8:deps.bzl", j2v8 = "maven")
load("//jvm/utils:deps.bzl", utils = "maven")
load("//jvm/testutils:deps.bzl", testutils = "maven")
load("//jvm/perf:deps.bzl", perf = "maven")
load("//plugins:deps.bzl", plugins = "maven")
load("@rules_player//distribution:deps.bzl", distribution = "maven")
load("@grab_bazel_common//:workspace_defs.bzl", grab = "GRAB_BAZEL_COMMON_ARTIFACTS")

tooling = distribution + grab

maven = common + core + graaljs + j2v8 + utils + testutils + perf + plugins + tooling + android + demo
