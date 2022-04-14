load("@io_bazel_rules_kotlin//kotlin:android.bzl", "kt_android_library")
load("@rules_player//maven:parse_coordinates.bzl", "parse_coordinates")
load("//jvm/dependencies:versions.bzl", "versions")

kt_android_library(
  name = "test",
  srcs = ["assertions.kt", "AssetTest.kt"],
  deps = parse_coordinates([
    "androidx.test:core:1.4.0",
    "androidx.test.ext:junit-ktx:1.1.3",
    "junit:junit:4.12",
    "org.junit.vintage:junit-vintage-engine:%s" % versions.testing.jupiter
  ]) + [
    "//jvm/utils",
    "//plugins/reference-assets/android:assets",
    "//plugins/common-types/jvm:common-types",
    "//plugins/pending-transaction/jvm:pending-transaction",
    
    # TODO: Fix all this
    "@maven//:org_robolectric_robolectric",
    "@robolectric//bazel:android-all",
    "//plugins/reference-assets/mocks:jar",
  ],
  visibility = ["//plugins/reference-assets/android:__subpackages__"],
)
