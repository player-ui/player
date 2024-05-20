def _generate_mocks_manifest(context):
    manifest = context.actions.declare_file("manifest.json")
    context.actions.write(
        output = manifest,
        content = json.encode([
            {
                "group": group,
                "name": file.replace(".json", ""),
                "path": "./%s/%s/%s" % (root, group, file),
            }
            for root, group, file in [
                mock.path.split("/")[-3:]
                for filegroup in context.attr.mocks
                for mock in filegroup[DefaultInfo].files.to_list()
            ]
        ]),
    )
    return [DefaultInfo(files = depset([manifest], transitive = [mock[DefaultInfo].files for mock in context.attr.mocks]))]

generate_mocks_manifest = rule(
    attrs = {
        "mocks": attr.label_list(
            allow_files = [".json"],
        ),
    },
    implementation = _generate_mocks_manifest,
)
