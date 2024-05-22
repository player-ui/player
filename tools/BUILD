load("@aspect_rules_js//js:defs.bzl", "js_library")

exports_files([
    "tsup.config.ts.tmpl",
    "tsup.config.native.ts.tmpl",
    "vitest.config.ts.tmpl",
])

js_library(
    name = "vitest_coverage_mapper",
    srcs = ["vitest_coverage_mapper.ts"],
    visibility = ["//visibility:public"],
)
