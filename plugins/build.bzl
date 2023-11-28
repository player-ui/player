# load("//jvm:build.bzl", _kt_player_module = "kt_player_module")
# load("//jvm/dependencies:common.bzl", "test_deps")
# load("@bazel_skylib//lib:dicts.bzl", "dicts")

# def kt_player_plugin(
#         *,

#         # Artifact ID
#         name,

#         # Project level config
#         include_common_deps = True,

#         # Distribution config

#         # (optional) TODO: Maybe hardcode these
#         project_name = None,
#         project_description = None,
#         project_url = None,
#         scm_url = None,

#         # Package level config
#         module_name = None,
#         main_srcs = None,
#         main_resources = None,
#         main_resource_jars = None,
#         main_resource_strip_prefix = None,
#         main_associates = None,
#         main_deps = None,
#         main_exports = None,
#         main_runtime_deps = None,
#         test_package = None,
#         test_srcs = None,
#         test_resources = None,
#         test_resource_jars = None,
#         test_resource_strip_prefix = None,
#         test_associates = None,
#         test_deps = None,
#         test_runtime_deps = None):
#     _kt_player_module(
#         name = name,
#         include_common_deps = include_common_deps,
#         group = "com.intuit.player.plugins",

#         # (optional) TODO: Maybe hardcode these
#         project_name = project_name,
#         project_description = project_description,
#         project_url = project_url,
#         scm_url = scm_url,

#         # Package level config
#         module_name = module_name,
#         main_srcs = main_srcs,
#         main_resources = main_resources,
#         main_resource_jars = main_resource_jars,
#         main_resource_strip_prefix = main_resource_strip_prefix,
#         main_associates = main_associates,
#         main_deps = main_deps,
#         main_exports = main_exports,
#         main_runtime_deps = main_runtime_deps,
#         test_package = test_package,
#         test_srcs = test_srcs,
#         test_resources = test_resources,
#         test_resource_jars = test_resource_jars,
#         test_resource_strip_prefix = test_resource_strip_prefix,
#         test_associates = test_associates,
#         test_deps = test_deps,
#         test_runtime_deps = test_runtime_deps,
#     )

# def kt_player_plugin_wrapper(
#         *,

#         # Artifact ID
#         name,
#         package_scope,
#         plugin_name,
#         plugin_source,
#         resources,

#         # (optional) TODO: Maybe hardcode these
#         project_name = None,
#         project_description = None,
#         project_url = None,
#         scm_url = None):
#     package = "com.intuit.player.plugins.%s" % package_scope
#     generate_plugin_wrapper(
#         name = "%s-gen" % name,
#         package = package,
#         plugin_name = plugin_name,
#         plugin_constructor = "%s.%s" % (plugin_name, plugin_name),
#         plugin_source_path = plugin_source,
#     )

#     generate_plugin_test_wrapper(
#         name = "%s-gen-test" % name,
#         package = package,
#         plugin_name = plugin_name,
#     )

#     kt_player_plugin(
#         name = name,
#         include_common_deps = False,
#         main_srcs = ["%s-gen" % name],
#         main_deps = ["//jvm/core"],
#         main_exports = ["//jvm/core"],
#         main_resources = [resources],
#         test_srcs = ["%s-gen-test" % name],
#         test_deps = test_deps,
#         test_package = package,
#     )

# def _generate_file(context):
#     generated = context.actions.declare_file("%s%s.kt" % (context.attr.plugin_name, "Test" if hasattr(context.attr, "_test") else ""))
#     context.actions.expand_template(
#         output = generated,
#         template = context.file._template,
#         substitutions = {
#             "@{{%s}}" % key: getattr(context.attr, key)
#             for key in dir(context.attr)
#             if type(getattr(context.attr, key)) == "string"
#         },
#     )
#     return [DefaultInfo(files = depset([generated]))]

# _generate_attrs = {
#     "package": attr.string(mandatory = True),
#     "plugin_name": attr.string(mandatory = True),
# }

# generate_plugin_wrapper = rule(
#     implementation = _generate_file,
#     attrs = dicts.add(
#         _generate_attrs,
#         plugin_constructor = attr.string(mandatory = True),
#         plugin_source_path = attr.string(mandatory = True),
#         _template = attr.label(
#             allow_single_file = True,
#             default = "plugin_wrapper_template.kt.tpl",
#         ),
#     ),
# )

# generate_plugin_test_wrapper = rule(
#     implementation = _generate_file,
#     attrs = dicts.add(
#         _generate_attrs,
#         _test = attr.bool(default = True),
#         _template = attr.label(
#             allow_single_file = True,
#             default = "plugin_wrapper_test_template.kt.tpl",
#         ),
#     ),
# )
