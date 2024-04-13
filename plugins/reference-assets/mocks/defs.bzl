def _generate_manifest(context):
    manifest = context.actions.declare_file("manifest.json")
    context.actions.write(
        output = manifest,
        content = json.encode([
            {
                "group": group,
                "name": file.replace(".json", ""),
                "path": "./%s/%s/%s" % (root,group,file),
            }
            for root, group, file in [
                mock.path.split("/")[-3:]
                for filegroup in context.attr.mocks
                for mock in filegroup[DefaultInfo].files.to_list()
            ]
        ]),
    )
    return [DefaultInfo(files = depset([manifest], transitive = [mock[DefaultInfo].files for mock in context.attr.mocks]))]

generate_manifest = rule(
    attrs = {
        "mocks": attr.label_list(
            allow_files = [".json"],
        ),
    },
    implementation = _generate_manifest,
)


def combine_files(files):
    print("hello world")
    output_dir = "merged"
    outputs = []
    for file in files:
        outputs.append(file)
    return outputs

