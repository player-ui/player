load("@rules_player//distribution/tar:defs.bzl", "stamp_tar_files")
load("@rules_player//gh-pages:defs.bzl","gh_pages")

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

stamp_tar_files(
   name = "full_site_stamped",
   tar = ":full_site",
   substitutions = {
     "NEXT_PUBLIC_GA_MEASUREMENT_ID": "{STABLE_GA_MEASUREMENT_ID}",
     "DOCS_BASE_PATH": "{STABLE_DOCS_BASE_PATH}",
     "ALGOLIA_SEARCH_API_KEY": "{STABLE_ALGOLIA_SEARCH_API_KEY}",
  },
)

genrule(
  name = "get_version",
  srcs = ["//:VERSION"],
  outs = ["VERSION"],
  cmd = "cat $(SRCS) > $@"
)

gh_pages(
  name="gh_deploy",
  source_dir="$(location :full_site_stamped)",
  repo="player-ui/player-ui.github.io",
  data = [":full_site_stamped", ":get_version"],
  version = "$(location :get_version)",
)