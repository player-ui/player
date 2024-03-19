workspace(
    name = "player",
    managed_directories = {
        "@npm": ["node_modules"],
        "@Pods": ["xcode/Pods"],
    },
)

load("//:build_constants.bzl", "build_constants")

build_constants()

load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive", "http_file")
load("@bazel_tools//tools/build_defs/repo:git.bzl", "git_repository")

git_repository(
    name = "rules_jvm_external",
    branch = "maven-export-aar",
    patches = [
        "//patches:rules_jvm_external.default_public_visibility.patch",
    ],
    remote = "https://github.com/sugarmanz/rules_jvm_external",
)

http_archive(
  name = "rules_player",
  strip_prefix = "rules_player-0.12.0",
  urls = ["https://github.com/player-ui/rules_player/archive/refs/tags/v0.12.0.tar.gz"],
  sha256 = "44dd1cd289166f7ccb7932e88f4fb71446132fe247c1caf1a2e59ffe3344ffcc"
)

load("@rules_player//:workspace.bzl", "deps")

deps(
    android_api_version = 31,
    android_build_tools_version = "30.0.2"
)

load("@rules_player//:conf.bzl", "apple", "javascript", "kotlin")

#####################
# Yarn Dependencies #
#####################
javascript()

load("@build_bazel_rules_nodejs//:index.bzl", "node_repositories", "yarn_install")

node_repositories(
    node_version = "16.12.0",
    yarn_version = "1.22.17",
)

yarn_install(
    name = "npm",
    included_files = [],
    package_json = "//:package.json",
    strict_visibility = False,
    yarn_lock = "//:yarn.lock",
)

#####################
# CocoaPods Dependencies #
#####################
apple()

load("@rules_player//cocoapods:cocoapod.bzl", "pod_install")

pod_install(
    name = "Pods",
    executable = "bundle exec pod",
    flags = [
        "--allow-root",
        "--repo-update",
    ],
    podfile = "//xcode:Podfile",
)

######################
# Kotlin Setup       #
######################
kotlin()

load("@io_bazel_rules_kotlin//kotlin:core.bzl", "kt_register_toolchains")

register_toolchains("//jvm:kotlin_toolchain")

load("@rules_player//junit5:conf.bzl", "junit5")

junit5()

######################
# Android Setup      #
######################
grab_remote = "https://github.com/sugarmanz/grab-bazel-common.git"

grab_commit = "35317b3d1c0da07b42af6e6a2137ebdec0ffe400"

git_repository(
    name = "grab_bazel_common",
    commit = grab_commit,
    remote = grab_remote,
    shallow_since = "1706157787 -0500",
)

load("@grab_bazel_common//android:repositories.bzl", "bazel_common_dependencies")

bazel_common_dependencies()

load("@grab_bazel_common//android:initialize.bzl", "bazel_common_initialize")

bazel_common_initialize(
    pinned_maven_install = False,
)

http_archive(
    name = "robolectric",
    sha256 = "4e002cbe712c8abd9c3b565eb165787a2a7a92dfafb117e0d84b6767c2053189",
    strip_prefix = "robolectric-bazel-4.8",
    urls = ["https://github.com/robolectric/robolectric-bazel/archive/4.8.tar.gz"],
)

load("@robolectric//bazel:robolectric.bzl", "robolectric_repositories")

robolectric_repositories()

ANDROIDX_TEST_VERSION = "1.4.2"

http_file(
    name = "android_test_orchestrator_apk",
    sha256 = "b7a2e7d0184b03e12c7357f3914d539da40b52a11e90815edff1022c655f459b",
    url = "https://dl.google.com/android/maven2/androidx/test/orchestrator/%s/orchestrator-%s.apk" % (ANDROIDX_TEST_VERSION, ANDROIDX_TEST_VERSION),
)

http_file(
    name = "android_test_services_apk",
    sha256 = "c6bc74268b29bdabad8da962e00e2f6fd613c24b42c69e81b258397b4819f156",
    url = "https://dl.google.com/android/maven2/androidx/test/services/test-services/%s/test-services-%s.apk" % (ANDROIDX_TEST_VERSION, ANDROIDX_TEST_VERSION),
)

http_archive(
    name = "build_bazel_rules_android",
    sha256 = "cd06d15dd8bb59926e4d65f9003bfc20f9da4b2519985c27e190cddc8b7a7806",
    strip_prefix = "rules_android-0.1.1",
    urls = ["https://github.com/bazelbuild/rules_android/archive/v0.1.1.zip"],
)

overridden_targets = {
    # Override the maven dep with the fixed target
    "org.jetbrains.kotlinx:kotlinx-coroutines-core-jvm": "@//android/demo:kotlinx_coroutines_core_jvm_fixed",
}

android_ndk_repository(name = "androidndk")

register_toolchains("@androidndk//:all")

######################
# Maven Dependencies #
######################
load("@rules_jvm_external//:repositories.bzl", "rules_jvm_external_deps")

rules_jvm_external_deps()

load("@rules_jvm_external//:setup.bzl", "rules_jvm_external_setup")

rules_jvm_external_setup()

load("//jvm/dependencies:deps.bzl", artifacts = "maven")
load("@rules_jvm_external//:defs.bzl", "maven_install")

maven_install(
    artifacts = artifacts,
    fetch_sources = True,
    override_targets = overridden_targets,
    repositories = [
        "https://repo1.maven.org/maven2",
        "https://maven.google.com/",
        "https://plugins.gradle.org/m2/",
        "https://jcenter.bintray.com/",
        "https://jitpack.io/",
    ],
)

maven_install(
    name = "kotlinx_coroutines_core_fixed",
    artifacts = [
        "org.jetbrains.kotlinx:kotlinx-coroutines-core-jvm:jar:1.5.2",
    ],
    fetch_sources = True,
    repositories = [
        "https://repo1.maven.org/maven2",
    ],
)
