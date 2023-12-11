load("@rules_pkg//:pkg.bzl", "pkg_zip")
load("@rules_pkg//:mappings.bzl", "pkg_files", "strip_prefix")

def ios_bundle_module_shim(name):
    native.genrule(
        name = name + "ResourceShim",
        srcs = ["//tools/ios:ResourceShimTemplate.swift"],
        outs = [name + "ResourceShim.swift"],
        cmd = "sed 's/PLACEHOLDER/" + name + "/g' < $< > $@"
    )


def assemble_pod(
  name,
  podspec = '',
  srcs = [],
  data = {}
):
  pkg_files(
    name = "podspec",
    srcs = [podspec],
    strip_prefix = strip_prefix.from_pkg(),
  )

  pkg_files(
    name = "srcs",
    srcs = srcs,
    strip_prefix = strip_prefix.from_pkg(),
  )

  data_pkgs = []
  for target in data:
    ident = "data_%d" % len(data_pkgs)
    pkg_files(
      name = ident,
      srcs = [target],
      strip_prefix = strip_prefix.from_pkg(),
      prefix = data[target]
    )
    data_pkgs.append(ident)

  pkg_zip(
      name = name,
      srcs = ["podspec", "srcs"] + data_pkgs
  )