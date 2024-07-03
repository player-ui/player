def _fat_transition_impl(_, __):
    return {
        "arm64-v8a-platform": {"//command_line_option:cpu": "arm64-v8a"},
        "armeabi-v7a-platform": {"//command_line_option:cpu": "armeabi-v7a"},
        "x86-platform": {"//command_line_option:cpu": "x86"},
        "x86_64-platform": {"//command_line_option:cpu": "x86_64"},
    }

fat_transition = transition(
    implementation = _fat_transition_impl,
    inputs = [],
    outputs = ["//command_line_option:cpu"],
)

def _cc_android_library_impl(context):
    pass

cc_android_library = rule(
    implementation = _cc_android_library_impl,
    attrs = {
        "tool": attr.label(providers, cfg = fat_transition),
        "_allowlist_function_transition": attr.label(
            default = "@bazel_tools//tools/allowlists/function_transition_allowlist",
        ),
    },
)
