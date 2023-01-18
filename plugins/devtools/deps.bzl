load("//plugins/devtools/android:deps.bzl", android = "maven")
load("//plugins/devtools/jvm:deps.bzl", jvm = "maven")

maven = android + jvm
