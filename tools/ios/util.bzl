load("@rules_pkg//:pkg.bzl", "pkg_zip")
load("@rules_pkg//:mappings.bzl", "pkg_files", "strip_prefix")
load("@build_bazel_rules_apple//apple:resources.bzl", "apple_resource_bundle")
load("@build_bazel_rules_swift//swift:swift.bzl", "swift_library")
load("@build_bazel_rules_ios//rules:test.bzl", "ios_unit_test", "ios_ui_test")

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

def _ios_js_plugin(name, resources, deps, test_deps, hasUnitTests, hasViewInspectorTests):
  """Packages source files, creates swift library and tests for a swift PlayerUI plugin

  Args:
    name: The base name of this package
      Targets created by this macro prefix the name with 'PlayerUI'
    resources: Any resources to include in a resource bundle
      This will create a Bundle.module shim as well automatically
    deps: Dependencies for the plugin
    test_deps: Dependencies for the tests of this plugin
    hasUnitTests: Whether or not to generate ios_unit_test tests
    hasUITests: Whether or not to generate ios_ui_test tests
  """
  default_dependencies = ["//ios/core:PlayerUI"]
  default_test_dependencies = ["//ios/internal-test-utils:PlayerUIInternalTestUtilities"]
  # Prefix the name, since SPM each plugin is a different import
  # It makes it clear they are all from the same package
  plugin_name = "PlayerUI" + name
  # if we are backed by a JS plugin, these attributes
  # will be populated to add to the sources/resources of the
  # swift_library
  data = []
  resourceSources = []
  if len(resources) > 0:
    apple_resource_bundle(
      name = plugin_name + "ResourceBundle",
      bundle_name = name,
      bundle_id = "com.intuit.ios.player.resources."+name,
      resources = resources,
    )

    ios_bundle_module_shim(name)
    data.append(":" + plugin_name + "ResourceBundle")
    resourceSources.append(":" + name + "ResourceShim")

  # Group up files to be used in swift_library
  # and in //:PlayerUI_Pod which builds the zip of sources
  pkg_files(
    name = plugin_name + "_Sources",
    srcs = native.glob(["Sources/**/*.swift"]),
    strip_prefix = strip_prefix.from_pkg(),
    visibility = ["//visibility:public"],
  )

  swift_library(
      name = plugin_name,
      module_name = plugin_name,
      srcs = [":" + plugin_name + "_Sources"] + resourceSources,
      visibility = ["//visibility:public"],
      deps = default_dependencies + deps,
      data = data,
      # this define makes Bundle.module extension work from ios_bundle_module_shim
      defines = ["BAZEL_TARGET"]
  )

  # Plugins not specific to SwiftUI don't need ViewInspector
  # so it can just be regular unit tests
  if hasUnitTests == True:
    ios_unit_test(
        name = plugin_name + "Tests",
        srcs = native.glob(["Tests/**/*.swift"]),
        minimum_os_version = "14.0",
        deps = [
          ":" + plugin_name
        ] + default_dependencies + deps + default_test_dependencies + test_deps,
        visibility = ["//visibility:public"]
    )
  # ViewInspector has to run as a UI Test to work properly
  # SwiftUI plugins need ViewInspector
  if hasViewInspectorTests == True:
    ios_ui_test(
        name = plugin_name + "ViewInspectorTests",
        srcs = native.glob(["ViewInspector/**/*.swift"]),
        minimum_os_version = "14.0",
        deps = [
            "@swiftpkg_viewinspector//:Sources_ViewInspector",
            ":" + plugin_name
        ] + default_dependencies + deps + default_test_dependencies + test_deps,
        visibility = ["//visibility:public"],
        test_host = "//ios/demo:PlayerUIDemo"
    )


def ios_plugin(name, resources = [], deps = [], test_deps = []):
  """Packages source files, creates swift library and tests for an iOS PlayerUI plugin

  Args:
    name: The base name of this package
      Targets created by this macro prefix the name with 'PlayerUI'
    resources: Any resources to include in a resource bundle
      This will create a Bundle.module shim as well automatically
    deps: Dependencies for the plugin
    test_deps: Dependencies for the tests of this plugin
  """
  _ios_js_plugin(
      name = name, 
      resources = resources, 
      deps = deps, 
      test_deps = test_deps, 
      hasUnitTests = True, 
      hasViewInspectorTests = False
  )

def swiftui_plugin(name, resources = [], deps = [], test_deps = []):
  """Packages source files, creates swift library and tests for a SwiftUI PlayerUI plugin

  Args:
    name: The base name of this package
      Targets created by this macro prefix the name with 'PlayerUI'
    resources: Any resources to include in a resource bundle
      This will create a Bundle.module shim as well automatically
    deps: Dependencies for the plugin
    test_deps: Dependencies for the tests of this plugin
  """
  _ios_js_plugin(
      name = name, 
      resources = resources, 
      deps = deps, 
      test_deps = test_deps, 
      hasUnitTests = False, 
      hasViewInspectorTests = True
  )