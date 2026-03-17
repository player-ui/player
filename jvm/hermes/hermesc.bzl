def _hermes_compile_impl(context):
    input = context.file.js
    hbc = context.actions.declare_file("%s.hbc" % input.basename)

    args = context.actions.args()
    args.add("-emit-binary")
    args.add("-out", hbc)
    args.add(input)

    context.actions.run(
        mnemonic = "HermesC",
        executable = context.executable._hermesc,
        arguments = [args],
        inputs = depset([input]),
        outputs = [hbc],
    )

    return [DefaultInfo(files = depset([hbc]))]

hermes_compile = rule(
    implementation = _hermes_compile_impl,
    attrs = {
        "js": attr.label(
            allow_single_file = True,
        ),
        "_hermesc": attr.label(
            default = Label("@hermes//:hermesc"),
            allow_single_file = True,
            executable = True,
            cfg = "exec",
        ),
    },
)
