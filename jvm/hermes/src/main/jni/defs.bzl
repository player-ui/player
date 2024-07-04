def _fat_transition_impl(_, __):
    return {
        "arm64-v8a-platform": {
            "//command_line_option:cpu": "arm64-v8a",
            "//command_line_option:crosstool_top": "@androidndk//:default_crosstool",
            "//command_line_option:host_crosstool_top": "@bazel_tools//tools/cpp:toolchain",
        },
        "armeabi-v7a-platform": {
            "//command_line_option:cpu": "armeabi-v7a",
            "//command_line_option:crosstool_top": "@androidndk//:default_crosstool",
            "//command_line_option:host_crosstool_top": "@bazel_tools//tools/cpp:toolchain",
        },
        "x86-platform": {
            "//command_line_option:cpu": "x86",
            "//command_line_option:crosstool_top": "@androidndk//:default_crosstool",
            "//command_line_option:host_crosstool_top": "@bazel_tools//tools/cpp:toolchain",
        },
        "x86_64-platform": {
            "//command_line_option:cpu": "x86_64",
            "//command_line_option:crosstool_top": "@androidndk//:default_crosstool",
            "//command_line_option:host_crosstool_top": "@bazel_tools//tools/cpp:toolchain",
        },
    }

fat_transition = transition(
    implementation = _fat_transition_impl,
    inputs = [],
    outputs = [
        "//command_line_option:cpu",
        "//command_line_option:crosstool_top",
        "//command_line_option:host_crosstool_top",
    ],
)

def _cc_android_library_impl(context):
    pass

cc_android_library = rule(
    implementation = _cc_android_library_impl,
    attrs = {
        "tool": attr.label(cfg = fat_transition),
        "_allowlist_function_transition": attr.label(
            default = "@bazel_tools//tools/allowlists/function_transition_allowlist",
        ),
    },
)

def _attach_jni_impl(context):
    base_lib = context.attr.android_lib
    base_aar = base_lib[AndroidLibraryAarInfo].aar
    native_libs = context.split_attr.native_lib
    print(native_libs)

    #    native_libs_sos = [native_libs[arch][DefaultInfo].files.to_list()[1].path for arch in native_libs]
    native_libs_sos = [native_libs[arch][DefaultInfo].files for arch in native_libs]
    print(native_libs_sos)

    native_libs_sos_files = [file for native_lib_so in native_libs_sos for file in native_lib_so.to_list()]

    #    print([file.path for file in native_lib_so.to_list() for native_lib_so in native_libs_sos])
    print(native_libs_sos_files)

    #    native_libs = [lib[] for lib in native_lib]
    enriched_aar = context.actions.declare_file("{}.aar".format(context.label.name))

    # TODO: Make all this dynamic so we don't need to list all the platforms explicitly
    arm64_v8a_libs = native_libs["arm64-v8a-platform"][DefaultInfo].files.to_list()[0]
    armeabi_v7a_libs = native_libs["armeabi-v7a-platform"][DefaultInfo].files.to_list()[0]
    x86_libs = native_libs["x86-platform"][DefaultInfo].files.to_list()[0]
    x86_64_libs = native_libs["x86_64-platform"][DefaultInfo].files.to_list()[0]

    print(native_libs["arm64-v8a-platform"][DefaultInfo])

    context.actions.run_shell(
        # TODO: Verify inputs
        inputs = [base_aar, arm64_v8a_libs, armeabi_v7a_libs, x86_libs, x86_64_libs],
        outputs = [enriched_aar],
        progress_message = "Enriching source AAR ({}) with JNI libs from {}".format(base_lib.label.name, context.attr.native_lib[0].label.name),
        command = """
            # Unzip base .aar
            TEMP="$$(mktemp -d)"
            unzip -q -o {base_aar} -d $$TEMP/

            # Copy arm64-v8a libs
            mkdir -p $$TEMP/jni/arm64-v8a/
            cp {arm64_v8a_libs} $$TEMP/jni/arm64-v8a/

            # Copy armeabi-v7a libs
            mkdir -p $$TEMP/jni/armeabi-v7a/
            cp {armeabi_v7a_libs} $$TEMP/jni/armeabi-v7a/

            # Copy x86 libs
            mkdir -p $$TEMP/jni/x86/
            cp {x86_libs} $$TEMP/jni/x86/

            # Copy x86_64 libs
            mkdir -p $$TEMP/jni/x86_64/
            cp {x86_64_libs} $$TEMP/jni/x86_64/

            # Rezip
            aar=$(pwd)/{output}
            cd $$TEMP; zip -q -r output.aar .
            cp output.aar $aar
            """.format(
            base_aar = base_aar.path,
            arm64_v8a_libs = arm64_v8a_libs.path,
            armeabi_v7a_libs = armeabi_v7a_libs.path,
            x86_libs = x86_libs.path,
            x86_64_libs = x86_64_libs.path,
            output = enriched_aar.path,
            libname = "libhermes_jni.so",
        ),
    )

    return [
        base_lib[JavaInfo],
        AndroidLibraryAarInfo(
            aar = enriched_aar,
            manifest = enriched_aar,  #base_lib[AndroidLibraryAarInfo].manifest,
            aars_from_deps = [],  #base_lib[AndroidLibraryAarInfo].aars_from_deps,
            defines_local_resources = True,
        ),
        DefaultInfo(
            files = depset([enriched_aar], transitive = depset([])),
        ),
    ]

attach_jni = rule(
    implementation = _attach_jni_impl,
    attrs = {
        #        "android_lib": attr.label(providers = [
        #            AndroidLibraryAarInfo,
        #            JavaInfo,
        #        ]),
        "android_lib": attr.label(providers = [
            AndroidLibraryAarInfo,
            JavaInfo,
        ]),
        "native_lib": attr.label(cfg = fat_transition),
        "_allowlist_function_transition": attr.label(
            default = "@bazel_tools//tools/allowlists/function_transition_allowlist",
        ),
    },
    provides = [AndroidLibraryAarInfo, JavaInfo],
)
