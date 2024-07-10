def copy_shared_lib(name, srcs, libname = None):
    libname = libname if libname else name
    native.genrule(
        name = name,
        srcs = srcs,
        outs = ["{}.so".format(libname)],
        cmd = "echo $(SRCS) | tr ' ' '\\n' | grep %s | xargs -I {} cp {} $(OUTS)" % "{}.{}".format(libname, select({
            "@bazel_tools//src/conditions:darwin": "dylib",
            "//conditions:default": "so",
        })),
    )
