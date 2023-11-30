def _values_to_const(k, v):
    return "public val %s = %s;" % (k, v)

def _applitools_config_impl(ctx, **kwargs):
    o = ctx.actions.declare_file("ApplitoolsConfig.kt")
    head = [
        "package %s;" % ctx.attr.package,
        "public object ApplitoolsConfig {",
        "    public val API_KEY: String? = " + ("\"" + ctx.var["APPLITOOLS_API_KEY"] + "\"" if "APPLITOOLS_API_KEY" in ctx.var else "null"),
        "    public val BATCH_ID: String = " + ("\"" + ctx.var["APPLITOOLS_BATCH_ID"] + "\"" if "APPLITOOLS_BATCH_ID" in ctx.var else "\"local\""),
        "    public val PR_NUMBER: String = " + ("\"" + ctx.var["APPLITOOLS_PR_NUMBER"] + "\"" if "APPLITOOLS_PR_NUMBER" in ctx.var else "\"UNSET\""),
    ]
    last = ["}"]
    values = ctx.attr.values
    xs = [_values_to_const(x, values[x]) for x in values]
    ctx.actions.write(o, "\n".join(
        head + xs + last,
    ))
    return [DefaultInfo(files = depset([o])), OutputGroupInfo(all_files = depset([o]))]

applitools_config = rule(
    implementation = _applitools_config_impl,
    output_to_genfiles = True,
    attrs = {
        "values": attr.string_dict(doc = "BuildConfig values, KEY -> VALUE"),
        "package": attr.string(mandatory = True, doc = "package for generated class"),
    },
)
