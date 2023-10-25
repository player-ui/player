def _generate_manifest(context):
    manifest = context.actions.declare_file("manifest.json")
    context.actions.write(
        output = manifest,
        content = json.encode([
            {
                "group": group,
                "name": name.replace(".json", ""),
                "path": "./%s/%s" % (group, name),
            }
            for group, name in [
                mock.label.name.split("/")[-2:]
                for mock in context.attr.mocks
            ]
        ]),
    )
    return [DefaultInfo(files = depset([manifest], transitive = [mock[DefaultInfo].files for mock in context.attr.mocks]))]

generate_manifest = rule(
    attrs = {
        "mocks": attr.label_list(
            mandatory = True,
            allow_files = [".json"],
        ),
    },
    implementation = _generate_manifest,
)
