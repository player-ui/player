load("//jvm:defs.bzl", _kt_player_module = "kt_player_module")
load("@build_constants//:constants.bzl", "VERSION", _GROUP = "GROUP")
load("@rules_player//player:defs.bzl", _kt_player_plugin_wrapper = "kt_player_plugin_wrapper")

GROUP = _GROUP + ".plugins"

def kt_player_plugin(
        *,

        # Artifact ID
        name,

        # Project level config

        # Package level config
        module_name = None,
        main_srcs = None,
        main_resources = None,
        main_resource_jars = None,
        main_resource_strip_prefix = None,
        main_associates = None,
        main_deps = None,
        main_exports = None,
        main_runtime_deps = None,
        test_package = None,
        test_srcs = None,
        test_resources = None,
        test_resource_jars = None,
        test_resource_strip_prefix = None,
        test_associates = None,
        test_deps = None,
        test_runtime_deps = None):
    _kt_player_module(
        name = name,
        group = GROUP,

        # Package level config
        module_name = module_name,
        main_srcs = main_srcs,
        main_resources = main_resources,
        main_resource_jars = main_resource_jars,
        main_resource_strip_prefix = main_resource_strip_prefix,
        main_associates = main_associates,
        main_deps = main_deps,
        main_exports = main_exports,
        main_runtime_deps = main_runtime_deps,
        test_package = test_package,
        test_srcs = test_srcs,
        test_resources = test_resources,
        test_resource_jars = test_resource_jars,
        test_resource_strip_prefix = test_resource_strip_prefix,
        test_associates = test_associates,
        test_deps = test_deps,
        test_runtime_deps = test_runtime_deps,
    )

def kt_player_plugin_wrapper(
        *,

        # Artifact ID
        name,
        plugin_name,
        plugin_source,
        resources,
        package = GROUP,
        plugin_constructor = None):
    _kt_player_plugin_wrapper(
        name = name,
        package = package,
        plugin_name = plugin_name,
        plugin_source = plugin_source,
        resources = resources,
        plugin_constructor = plugin_constructor,

        # deps
        main_exports = ["//jvm/core"],
        main_deps = ["//jvm/core"],
        test_deps = ["//jvm/testutils"],

        # distribution
        group = GROUP,
        version = VERSION,
        pom_template = "//jvm:pom.tpl",

        # compiler opts
        main_opts = "//jvm:main_options",
        test_opts = "//jvm:test_options",
    )

    (package, platform) = native.package_name().split("/")[-2:]
    if name == package or name == "%s-%s" % (package, platform):
        native.alias(
            name = platform,
            actual = name,
            visibility = ["//visibility:public"],
        )

        # TODO: If test, alias test, etc. Requires upleveling
