load("@bazel_skylib//rules:expand_template.bzl", "expand_template")

def tsup_config(name):
  expand_template(
    name = name,
    out = "tsup.config.ts",
    substitutions = {},
    template = "//tools:tsup.config.ts.tmpl"
  )

def vitest_config(name):
  expand_template(
    name = name,
    out = "vitest.config.ts",
    substitutions = {},
    template = "//tools:vitest.config.ts.tmpl"
  )