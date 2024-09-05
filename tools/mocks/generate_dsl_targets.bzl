load("@rules_player//player:defs.bzl", compile_dsl = "compile")

def generate_all_dsl_mocks(MOCK_DIRS):
    for mock_dir in MOCK_DIRS:
        compile_dsl(
            name = "dsl_mocks_" + mock_dir,
            srcs = native.glob([
                mock_dir + "/*.tsx",
            ]),
            input_dir = mock_dir,
            output_dir = mock_dir,
            config = ":dsl_config",
            data = [
                ":node_modules/@player-ui/reference-assets-cli-preset",
                ":node_modules/@player-ui/reference-assets-plugin-components",
                "//:node_modules/@player-tools/dsl",
                "//:node_modules/@types/react",
                "//:node_modules/dlv",
                "//:node_modules/react",
            ],
        )
