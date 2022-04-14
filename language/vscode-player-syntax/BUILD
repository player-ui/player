load("@rules_player//player/vsce:package.bzl", "package")

package(
    name = "player-syntax",
    data = [
        "package.json",
        ".vscodeignore",
        "language-configuration.json",
        # When version gets stamped the build needs to rerun since Bazel can't stamp the binary output 
        "//:VERSION"
    ] + glob(["syntaxes/*"])
)
