load("@rules_player//player:defs.bzl", compile_dsl = "compile")

def generate_all_dsl_mocks(MOCK_DIRS):
    for mock_dir in MOCK_DIRS:
        compile_dsl(
            name = "dsl_mocks_" + mock_dir,
            srcs = native.glob([
                mock_dir + "/*.tsx",
            ]),
            # TODO: Load xlr configs properly
            skip_test = True,
            config = ":dsl_config",
            data = [
                ":node_modules/@player-ui/reference-assets-cli-plugin",
                ":node_modules/@player-ui/reference-assets-plugin-components",
                "//:node_modules/@player-tools/dsl",
                "//:node_modules/@types/react",
                "//:node_modules/dlv",
                "//:node_modules/react",
            ],
        )
