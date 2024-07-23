load("@bazel_tools//tools/build_defs/pkg:pkg.bzl", "pkg_tar")
load("@rules_player//distribution/tar:stamp_tar_files.bzl", "stamp_tar_files")


load("@bazel_tools//tools/build_defs/pkg:pkg.bzl", "pkg_tar")

genrule(
  name = "full_site",
  srcs = [
    "//docs/site",
  ],
  outs = [
    "merged_site.tar.gz"
  ],
  cmd="""
  tmp_dir=$$(mktemp -d) &&
  touch $$tmp_dir/.nojekyll &&
  cp -LR $(location //docs/site)/** $$tmp_dir &&
  chmod -R u+rwX,a+rX $$tmp_dir &&
  tar -czhf $@ -C $$tmp_dir .
  """
)


stamp_tar_files(
   name = "full_site_stamped",
   tar = ":full_site",
   substitutions = {
     "NEXT_PUBLIC_GA_MEASUREMENT_ID": "{STABLE_GA_MEASUREMENT_ID}",
     "DOCS_BASE_PATH": "{STABLE_DOCS_BASE_PATH}",
     "ALGOLIA_SEARCH_API_KEY": "{STABLE_ALGOLIA_SEARCH_API_KEY}",
  }
)

#gh_pages(
#  name="deploy_docs",
#  source_dir="$(location :full_site_stamped)",
#  repo="player-ui/player-ui.github.io",
#  data = [":full_site_stamped"]
#)