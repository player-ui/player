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

def ios_pipeline(
  name,
  resources,
  deps,
  test_deps,
  hasUnitTests,
  hasViewInspectorTests,
  needsXCTest = False,
  bundle_name = None
):
  
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
    needsXCTest: set the 'testonly' attribute on swift_library
    bundle_name: optionally override the name used for the resource bundle
  """

  # if we are backed by a JS package, these attributes
  # will be populated to add to the sources/resources of the
  # swift_library
  data = []
  resourceSources = []

  bundleName = bundle_name if bundle_name != None else name

  if len(resources) > 0:
    apple_resource_bundle(
      name = name + "ResourceBundle",
      bundle_name = bundleName,
      bundle_id = "com.intuit.ios.player.resources."+name,
      resources = resources,
    )

    ios_bundle_module_shim(bundleName)
    data.append(":" + name + "ResourceBundle")
    resourceSources.append(":" + bundleName + "ResourceShim")

  # Group up files to be used in swift_library
  # and in //:PlayerUI_Pod which builds the zip of sources
  pkg_files(
    name = name + "_Sources",
    srcs = native.glob(["Sources/**/*.swift"]),
    strip_prefix = strip_prefix.from_pkg(),
    visibility = ["//visibility:public"],
  )

  swift_library(
      name = name,
      module_name = name,
      srcs = [":" + name + "_Sources"] + resourceSources,
      visibility = ["//visibility:public"],
      testonly = needsXCTest,
      deps = deps,
      data = data,
      # this define makes Bundle.module extension work from ios_bundle_module_shim
      defines = ["BAZEL_TARGET"]
  )

  # Packages not specific to SwiftUI don't need ViewInspector
  # so it can just be regular unit tests
  if hasUnitTests == True:
    ios_unit_test(
        name = name + "Tests",
        srcs = native.glob(["Tests/**/*.swift"]),
        minimum_os_version = "14.0",
        deps = [
          ":" + name
        ] + deps + test_deps,
        visibility = ["//visibility:public"]
    )
  # ViewInspector has to run as a UI Test to work properly
  # SwiftUI plugins need ViewInspector
  if hasViewInspectorTests == True:
    ios_ui_test(
        name = name + "ViewInspectorTests",
        srcs = native.glob(["ViewInspector/**/*.swift"]),
        minimum_os_version = "14.0",
        deps = [
            "@swiftpkg_viewinspector//:Sources_ViewInspector",
            ":" + name
        ] + deps + test_deps,
        visibility = ["//visibility:public"],
        test_host = "//ios/demo:PlayerUIDemo"
    )

  # Runs SwiftLint as a test calling the genrule target which outputs the result of linting
  native.sh_test(
    name = name + "SwiftLint",
    srcs = [":"+ name + "_Lint"],
    visibility = ["//visibility:public"],
  )

  # Runs the SwiftLint as part of the build, if lint fails with serious violations defer the results for the test
  native.genrule(
    name = name + "_Lint",
    tools = [
      "@SwiftLint//:swiftlint"
    ],
    srcs = [":" + name + "_Sources"] + ["//:.swiftlint.yml"],
    outs = ["output.sh"],
    executable = True,
    visibility = ["//visibility:public"],
    cmd="""
      echo `$(location @SwiftLint//:swiftlint) --config $(location //:.swiftlint.yml) $(SRCS) || true` > lint_results.txt
      LINT=$$(cat lint_results.txt)

      echo '#!/bin/bash' > $(location output.sh)
      echo "echo '$$LINT'" > $(location output.sh)

      LINESWITHERROR=$$(echo grep error lint_results.txt || true)
      echo "exit $$(($$LINESWITHERROR) | wc -l)" >> $(location output.sh)
  """
  )

default_dependencies = ["//ios/core:PlayerUI"]
default_test_dependencies = ["//ios/internal-test-utils:PlayerUIInternalTestUtilities"]

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
  ios_pipeline(
      name = "PlayerUI" + name,
      resources = resources, 
      deps = deps + default_dependencies,
      test_deps = test_deps + default_test_dependencies,
      hasUnitTests = True, 
      hasViewInspectorTests = False,
      needsXCTest = False,
      bundle_name = name
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
  ios_pipeline(
      name = "PlayerUI" + name,
      resources = resources, 
      deps = deps + default_dependencies,
      test_deps = test_deps + default_test_dependencies,
      hasUnitTests = False, 
      hasViewInspectorTests = True,
      needsXCTest = False,
      bundle_name = name
  )