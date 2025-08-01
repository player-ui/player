load("@rules_player//kotlin:defs.bzl", _distribution = "distribution", _kt_jvm = "kt_jvm")
load("@build_constants//:constants.bzl", "VERSION", "GROUP")
load("//jvm/dependencies:common.bzl", common_main_deps = "main_deps", common_test_deps = "test_deps")

def kt_player_module(
        *,

        # Artifact ID
        name,

        # Project level config
        include_common_deps = True,

        # Distribution config
        group = GROUP,
        deploy_env = None,
        excluded_workspaces = None,

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
    _kt_jvm(
        name = name,
        lint_config = "//jvm:lint_config",
        group = group,
        version = VERSION,
        deploy_env = deploy_env,
        excluded_workspaces = excluded_workspaces,
        pom_template = "//jvm:pom.tpl",
        module_name = module_name,
        main_opts = "//jvm:main_options",
        main_srcs = main_srcs,
        main_resources = main_resources,
        main_resource_jars = main_resource_jars,
        main_resource_strip_prefix = main_resource_strip_prefix,
        main_associates = main_associates,
        main_deps = (common_main_deps if include_common_deps else []) + (main_deps if main_deps else []),
        main_exports = main_exports,
        main_runtime_deps = main_runtime_deps,
        test_package = test_package,
        test_opts = "//jvm:test_options",
        test_srcs = test_srcs,
        test_resources = test_resources,
        test_resource_jars = test_resource_jars,
        test_resource_strip_prefix = test_resource_strip_prefix,
        test_associates = test_associates,
        test_deps = (common_test_deps if include_common_deps else []) + (test_deps if test_deps else []),
        test_runtime_deps = test_runtime_deps,
    )

def distribution(
        *,
        name,
        maven_coordinates,
        lib_name = None,
        pom_template = "//jvm:pom.tpl",
        **kwargs):
    _distribution(
        name = name,
        maven_coordinates = maven_coordinates,
        lib_name = lib_name,
        pom_template = pom_template,
        **kwargs
    )
