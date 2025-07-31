load("@rules_android//providers:providers.bzl", "AndroidLibraryAarInfo", "ApkInfo")

def _merge_jni_into_android_library_impl(context):
    merged_aar = context.outputs.aar
    source_lib = context.attr.android_library
    source_aar_info = source_lib[AndroidLibraryAarInfo]
    source_aar = source_aar_info.aar
    source_apk = context.attr.android_binary[ApkInfo].unsigned_apk

    context.actions.run_shell(
        inputs = [source_aar, source_apk],
        outputs = [merged_aar],
        progress_message = "Merging compiled JNI from {} into {}".format(source_apk.basename, source_aar.basename),
        command = """
        cp {source_aar} {merged_aar}
        chmod +w {merged_aar}
        unzip -q {source_apk} "lib/*" -d apk
        cp -r apk/lib jni
        zip -qr {merged_aar} jni/*/*.so
        """.format(
            source_aar = source_aar.path,
            merged_aar = merged_aar.path,
            source_apk = source_apk.path,
        ),
    )

    return [
        source_lib[JavaInfo],
        source_lib[DefaultInfo],
        source_lib[OutputGroupInfo],
        AndroidLibraryAarInfo(
            aar = merged_aar,
            manifest = merged_aar,
            aars_from_deps = [],
            defines_local_resources = True,
        ),
    ]

_merge_jni_into_android_library = rule(
    implementation = _merge_jni_into_android_library_impl,
    attrs = {
        "aar": attr.output(),
        "android_binary": attr.label(),
        "android_library": attr.label(providers = [AndroidLibraryAarInfo]),
        "deps": attr.label_list(default = []),
        "exports": attr.label_list(),
    },
    provides = [AndroidLibraryAarInfo, JavaInfo],
)

def merge_jni_into_android_library(
        name,
        android_library,
        cc_libs,
        cc_name,
        exports,
        tags):
    # Let android_binary x-compile our cc_libs for android
    native.android_binary(
        # cc_library targets will be compiled into the name of the android_binary target
        name = cc_name,
        custom_package = "does.not.matter",
        manifest = ":AndroidManifest.xml",
        deps = cc_libs + [android_library],
    )

    aar = "{}-merged.aar".format(name)
    _merge_jni_into_android_library(
        name = "{}-merged".format(name),
        aar = aar,
        android_binary = cc_name,
        android_library = android_library,
        exports = [android_library],
        tags = tags,
    )

    # Give local apps something to link against
    native.aar_import(
        name = name,
        aar = aar,
        tags = tags,
        deps = exports,
        visibility = ["//visibility:public"],
    )
