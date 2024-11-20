load("@bazel_skylib//rules:expand_template.bzl", "expand_template")

NATIVE_BUILD_DEPS = [
    "//:tsup_config",
    "//:typings",
    "//:node_modules/@swc/core",
]

def tsup_config(name):
    prefix = "../" * len(native.package_name().split("/"))

    expand_template(
        name = name,
        out = "tsup.config.ts",
        substitutions = {
            "%PREFIX%": prefix,
        },
        template = "//tools:tsup.config.ts.tmpl",
    )

def vitest_config(name):
    prefix = "../" * len(native.package_name().split("/"))

    expand_template(
        name = name,
        out = "vitest.config.mts",
        substitutions = {
            "%PREFIX%": prefix,
        },
        template = "//tools:vitest.config.mts.tmpl",
    )
