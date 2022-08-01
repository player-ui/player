load("@rules_player//player/vsce:index.bzl", "vsce")

vsce(
    name = "vscode-plugin",
    substitutions = {
        "__VERSION__": "{STABLE_VERSION}",
        "0.0.0-PLACEHOLDER": "{STABLE_VERSION}",
        "__GIT_COMMIT__": "{STABLE_GIT_COMMIT}",
    },
    data = [
        "package.json",
        ".vscodeignore",
        "language-configuration.json"
    ] + glob(["syntaxes/*"])
)