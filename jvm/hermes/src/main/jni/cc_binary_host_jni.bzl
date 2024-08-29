def _include_jni_transition(_, __):
    return {
        "//jvm/hermes/src/main/jni:include_jni": True,
    }

include_jni_transition = transition(
    implementation = _include_jni_transition,
    inputs = [],
    outputs = [
        "//jvm/hermes/src/main/jni:include_jni",
    ],
)

def _cc_library_host_jni_impl(context):
    cc_library = context.split_attr.cc_library[None]
    return [
        cc_library[CcInfo],
        cc_library[InstrumentedFilesInfo],
        cc_library[OutputGroupInfo],
    ]

cc_library_host_jni = rule(
    implementation = _cc_library_host_jni_impl,
    attrs = {
        "cc_library": attr.label(cfg = include_jni_transition),
        "_allowlist_function_transition": attr.label(
            default = "@bazel_tools//tools/allowlists/function_transition_allowlist",
        ),
    },
)
