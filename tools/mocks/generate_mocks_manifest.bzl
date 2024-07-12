def _determine_mock_info(file):
    return file.path.split("/")[-3:]

def _generate_mocks_manifest(context):
    mocks = [mock for group in context.attr.mocks for mock in group[DefaultInfo].files.to_list()]

    manifest = context.actions.declare_file("manifest.json")
    context.actions.write(
        output = manifest,
        content = json.encode([{
            "group": group,
            "name": file.replace(".json", ""),
            "path": "./%s/%s/%s" % (root, group, file),
        } for root, group, file in [_determine_mock_info(mock) for mock in mocks if mock.basename.endswith(".json")]]),
    )

    # we re-write the mocks so that we have a consistent prefix to trim
    mock_outputs = []
    for input in mocks:
        _, group, file = _determine_mock_info(input)
        output = context.actions.declare_file("{}/{}".format(group, file))
        mock_outputs += [output]
        context.actions.run_shell(
            outputs = [output],
            inputs = depset([input]),
            arguments = [input.path, output.path],
            command = "cp $1 $2",
        )

    return [DefaultInfo(files = depset([manifest] + mock_outputs))]

generate_mocks_manifest = rule(
    attrs = {
        "mocks": attr.label_list(
            allow_files = [".json"],
        ),
    },
    implementation = _generate_mocks_manifest,
)
