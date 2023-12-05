def ios_bundle_module_shim(name):
    native.genrule(
        name = name + "ResourceShim",
        srcs = ["//tools/ios:ResourceShimTemplate.swift"],
        outs = [name + "ResourceShim.swift"],
        cmd = "sed 's/PLACEHOLDER/" + name + "/g' < $< > $@"
    )