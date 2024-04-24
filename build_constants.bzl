def _build_constants_impl(repository_ctx):
    _BUILD_FILE = """
# DO NOT EDIT: automatically generated for _build_constants rule
filegroup(
    name = 'files',
    srcs = glob(['**']),
    visibility = ['//visibility:public']
)
"""
    repository_ctx.file("BUILD", _BUILD_FILE, False)

    version = repository_ctx.read(repository_ctx.attr.version_file)

    _CONSTANTS_FILE = """
# DO NOT EDIT: automatically generated for _build_constants rule
VERSION = \"{version}\"
"""

    repository_ctx.file(
        "constants.bzl",
        _CONSTANTS_FILE.format(version = version),
        False,
    )

_build_constants = repository_rule(
    implementation = _build_constants_impl,
    attrs = {
        "version_file": attr.label(
            default = Label("//:VERSION"),
            allow_single_file = True,
        ),
    },
)

def build_constants():
    _build_constants(name = "build_constants")
