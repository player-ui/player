load("//jvm/dependencies:versions.bzl", "versions")
load("//android/player:deps.bzl", player = "maven")
load("//android/demo:deps.bzl", demo = "maven")
load("//android/player-ui:deps.bzl", ui = "maven")

android = [
    # Grab Databinding
    "androidx.databinding:databinding-adapters:%s" % versions.androidx.databinding,
    "androidx.databinding:databinding-common:%s" % versions.androidx.databinding,
    "androidx.databinding:databinding-runtime:%s" % versions.androidx.databinding,

    # Grab Dagger
    "com.google.dagger:dagger:%s" % versions.dagger,
    "com.google.dagger:dagger-compiler:%s" % versions.dagger,
    "javax.inject:javax.inject:%s" % versions.javax.inject,

    # AndroidX Resolutions
    "androidx.activity:activity-ktx:%s" % versions.androidx.activity,
    "androidx.fragment:fragment-ktx:%s" % versions.androidx.fragment,
]

maven = android + player + demo + ui
