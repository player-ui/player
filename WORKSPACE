workspace(
    name = "player",
    managed_directories = {
        "@npm": ["node_modules"],
        "@Pods": ["xcode/Pods"],
    },
)

load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive", "http_file")
load("@bazel_tools//tools/build_defs/repo:git.bzl", "git_repository")

http_archive(
    name = "rules_player",
    sha256 = "c015a09ce2a5f999a89473cb9f71346c6831e27830a228ebe8f1ba25e83b77b2",
    strip_prefix = "rules_player-0.10.4",
    urls = ["https://github.com/player-ui/rules_player/archive/refs/tags/v0.10.4.tar.gz"],
)

load("@rules_player//:workspace.bzl", "deps")

deps()

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
load("@bazel_tools//tools/build_defs/repo:git.bzl", "git_repository")

grab_remote = "https://github.com/sugarmanz/grab-bazel-common.git"

grab_commit = "5326c6ba7a4e39e150c33e123134525473baffb6"

git_repository(
    name = "grab_bazel_common",
    commit = grab_commit,
    remote = grab_remote,
    shallow_since = "1700536974 -0500",
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

http_file(
    name = "android_test_orchestrator_apk",
    sha256 = "b7a2e7d0184b03e12c7357f3914d539da40b52a11e90815edff1022c655f459b",
    url = "https://dl.google.com/android/maven2/androidx/test/orchestrator/1.4.2/orchestrator-1.4.2.apk",
)

http_file(
    name = "android_test_services_apk",
    sha256 = "c6bc74268b29bdabad8da962e00e2f6fd613c24b42c69e81b258397b4819f156",
    url = "https://dl.google.com/android/maven2/androidx/test/services/test-services/1.4.2/test-services-1.4.2.apk",
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

load("@bazel_tools//tools/build_defs/repo:maven_rules.bzl", "maven_aar")

# Because J2V8 is published as type `aar.asc`
maven_aar(
    name = "android_j2v8",
    artifact = "com.eclipsesource.j2v8:j2v8:6.1.0",
)

# Because eyes androidx components is published as type `pom`
maven_aar(
    name = "androidx_eyes_components",
    artifact = "com.applitools:eyes-android-components-androidx:4.7.6",
    settings = "//android/demo:androidsettings.xml",
)

android_ndk_repository(name = "androidndk")

register_toolchains("@androidndk//:all")

######################
# Maven Dependencies #
######################
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

load("@vaticle_bazel_distribution//common:rules.bzl", "workspace_refs")

workspace_refs(name = "plugin_workspace_refs")
