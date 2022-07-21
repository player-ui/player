load("@rules_player//javascript/package_json:index.bzl", "merge_json", "create_contributors")
package(default_visibility = ["//visibility:public"])

create_contributors(
    name = "pkg_json_contrib",
    all_contributors = "//:.all-contributorsrc",
)

merge_json(
    name = "pkg_json_template",
    srcs = [
        "package-template.json",
        ":pkg_json_contrib",
    ]
)

exports_files([
    "jest-setup.js",
    "jest-coverage-mapper.js",
])
