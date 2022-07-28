load("@rules_player//javascript/package_json:index.bzl", "merge_json", "create_contributors")
load("//:index.bzl", "GIT_REPO", "LICENSE", "DOCS_URL", "REPO_URL", "ISSUES_URL")
package(default_visibility = ["//visibility:public"])

create_contributors(
    name = "pkg_json_contrib",
    all_contributors = "//:.all-contributorsrc",
)

genrule(
    name = "pkg_json_base",
    outs = ["pkg_json_base.json"],
    cmd = """
        echo '{
            "sideEffects": false,
            "license": "%s",
            "repository": {
                "type": "git",
                "url": "%s"
            },
            "bugs": {
                "url": "%s"
            },
            "homepage": "%s"
        }' > $@
    """ % (LICENSE, REPO_URL, ISSUES_URL, DOCS_URL),
)

merge_json(
    name = "pkg_json_template",
    srcs = [
        ":pkg_json_base",
        ":pkg_json_contrib",
    ]
)

exports_files([
    "jest-setup.js",
    "jest-coverage-mapper.js",
])
