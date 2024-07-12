load("@rules_pkg//:pkg.bzl", "pkg_zip")
load("@rules_pkg//:mappings.bzl", "pkg_files", "strip_prefix")
load("@rules_player//ios:defs.bzl", "ios_pipeline")

default_dependencies = ["//ios/core:PlayerUI"]
default_test_dependencies = ["//ios/internal-test-utils:PlayerUIInternalTestUtilities"]
test_host = "//ios/demo:PlayerUIDemo"

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
      test_host = test_host,
      needsXCTest = False,
      bundle_name = name
  )

def swiftui_plugin(name, resources = [], deps = [], test_deps = [], hasUITests = False):
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
      test_host = test_host,
      hasUITests = hasUITests,
      needsXCTest = False,
      bundle_name = name
  )