load("@bazel_tools//tools/build_defs/pkg:pkg.bzl", "pkg_tar")

genrule(
  name = "full_site",
  srcs = [
    "//docs/site",
    "//docs/storybook"
  ],
  outs = [
    "merged_site.tar.gz"
  ],
  cmd="""
  tmp_dir=$$(mktemp -d) &&
  touch $$tmp_dir/.nojekyll &&
  cp -LR $(location //docs/site)/** $$tmp_dir &&
  mkdir $$tmp_dir/storybook-demo &&
  cp -LR $(location //docs/storybook)/** $$tmp_dir/storybook-demo &&
  chmod -R u+rwX,a+rX $$tmp_dir &&
  tar -czhf $@ -C $$tmp_dir .
  """
)