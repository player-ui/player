load("@build_constants//:constants.bzl", "VERSION")
load("//jvm:defs.bzl", "DEFAULT_GROUP", "distribution", "kt_player_module")
load(":deps.bzl", "main_deps", "main_exports", "main_resources", "test_deps")

kt_player_module(
    name = "hermes",
    main_deps = main_deps,
    main_exports = main_exports,
    main_resources = main_resources + glob(["src/main/resources/**"]),
    test_deps = test_deps,
    test_package = "com.intuit.playerui",
)

# TODO: This should be the thing that contains the resource delegate loader source code and auto-initializer
java_library(
    name = "hermes-host",
    exports = [
        ":hermes",
        "//jvm/hermes/src/main/jni:resources",
    ],
)

genrule(
    name = "manifest",
    outs = ["AndroidManifest.xml"],
    cmd = """
cat > $(OUTS) <<EOF
<manifest
  xmlns:android="http://schemas.android.com/apk/res/android"
  package="does.not.matter">
  <uses-sdk android:minSdkVersion="999"/>
</manifest>
EOF
""",
)

android_binary(
    # name corresponds to compiled cc_lib
    name = "hermes_jni",
    custom_package = "does.not.matter",
    manifest = ":manifest",
    deps = [
        "hermes",
        "//jvm/hermes/libs:libc++_shared",
        "//jvm/hermes/libs:libfbjni",
        "//jvm/hermes/libs:libjsi",
        "//jvm/hermes/src/main/jni:hermes_jni_lib",
        "@rn_hermes_android//:libhermes",
    ],
)

android_library(
    name = "hermes-android-lib",
    custom_package = "com.intuit.playerui.hermes",
    visibility = ["//visibility:public"],
    exports = [
        # Kotlin Hermes JNI Runtime
        ":hermes",
    ],
)

# TODO: Likely need to wrap in a rule for publishing to work well (using aar_import to test)
genrule(
    name = "hermes-android-jni",
    srcs = [
        "hermes-android-lib.aar",
        "hermes_jni_unsigned.apk",
    ],
    outs = ["hermes-android-jni.aar"],
    cmd = """
cp $(location {}.aar) $(location :{}.aar)
chmod +w $(location :{}.aar)
unzip $(location :{}.apk) "lib/*" -d apk
cp -r apk/lib jni
zip -r $(location :{}.aar) jni/*/*.so
""".format("hermes-android-lib", "hermes-android-jni", "hermes-android-jni", "hermes_jni_unsigned", "hermes-android-jni"),
)

# This is messy as all hell, because we ultimately rely on android_binary for cross compiling our native binaries
# So, we create an android library to define the base library, and then copy the libs from the apk into the aar
# and then import it so we get our providers.
# If we can rely on transitions, then we could potentially create a cc_binary to rely on and pass through a rule
# that specifies the toolchain for the cc_binary dep and then add to an existing android_library .aar (and re-import (for export))
aar_import(
    name = "hermes-android",
    aar = "hermes-android-jni.aar",
    tags = ["maven_coordinates=%s:%s:%s" % (DEFAULT_GROUP, "hermes-android", VERSION)],
    visibility = ["//visibility:public"],
    deps = [":hermes"],
)

# TODO: This isn't picking up the AAR, so we'll likely need to wrap in the AAR in a real rule to provide the aar info
distribution(
    name = "hermes-android",
    maven_coordinates = "%s:%s:%s" % (DEFAULT_GROUP, "hermes-android", VERSION),
)

# TODO: This probably isn't necessary anymore
java_binary(
    name = "app",
    main_class = "com.intuit.playerui.hermes.bridge.runtime.HermesRuntimeKt",
    runtime_deps = [
        # TODO: Swap to hermes-host w/ app src
        ":hermes-host",
    ],
)
