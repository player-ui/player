def copy_output(name, srcs, file):
    native.genrule(
        name = name,
        srcs = srcs,
        outs = [file],
        cmd = "echo $(SRCS) | tr ' ' '\\n' | grep %s | xargs -I {} cp {} $(OUTS)" % file,
    )
