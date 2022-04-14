load("@bazel_tools//tools/build_defs/pkg:pkg.bzl", "pkg_tar")
load("@rules_player//gh-pages:index.bzl", "gh_pages")

pkg_tar(
    name = "docs",
    srcs = [
      "//docs/site",
      "//docs/storybook"
    ],
    mode = "0755",
    strip_prefix = "",
)

genrule(
  name = "full_site",
  srcs = [
    "//docs/site",
    "//docs/storybook"
  ],
  outs = [
    "merged_site"
  ],
  cmd="""
  mkdir $@ && 
  touch $@/.nojekyll &&
  cp -R $(location //docs/site)/** $@ &&
  mkdir $@/storybook-demo &&
  cp -R $(location //docs/storybook)/** $@/storybook-demo
  """
)

gh_pages(
  name="deploy_docs",
  source_dir="$(location :merged_site)",
  repo="player-ui/player-ui.github.io",
  data = ["merged_site"]
)