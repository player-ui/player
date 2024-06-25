load("@bazel_skylib//rules:expand_template.bzl", "expand_template")

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
        out = "vitest.config.ts",
        substitutions = {
            "%PREFIX%": prefix,
        },
        template = "//tools:vitest.config.ts.tmpl",
    )
