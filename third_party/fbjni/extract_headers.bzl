def _extract_headers_impl(ctx):
    cc_info = ctx.attr.lib[CcInfo]
    headers = [header for header in cc_info.compilation_context.headers.to_list()]
    out_dir = ctx.actions.declare_directory(ctx.label.name + "_headers")
    header_paths = " ".join([h.path for h in headers])
    # TODO: If we need to, we might need to preserve relative header paths
    ctx.actions.run_shell(
        inputs = headers,
        outputs = [out_dir],
        command = """
        mkdir -p "{out}"
        for f in {headers}; do
            cp "$f" "{out}/$(basename $f)"
        done
        """.format(out = out_dir.path, headers = header_paths),
    )

    return [DefaultInfo(files = depset([out_dir]))]

extract_headers = rule(
    implementation = _extract_headers_impl,
    attrs = {
        "lib": attr.label(providers=[CcInfo]),
    },
)
