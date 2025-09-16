load("@npm//:defs.bzl", "npm_link_all_packages")
load("@rules_player//player:defs.bzl", create_base_dsl_config = "create_base_config", compile_mocks = "compile_mocks")

npm_link_all_packages(name = "node_modules")

create_base_dsl_config(
    name = "dsl_config",
    presets = [
        ":node_modules/@player-ui/reference-assets-cli-preset",
    ],
)

compile_mocks(
    name = "mocks",
    mock_dirs = [
        "action",
        "choice",
        "collection",
        "image",
        "info",
        "input",
        "text",
        "chat-message",
    ],
    dsl_config = ":dsl_config",
    data = [
        ":node_modules/@player-ui/reference-assets-cli-preset",
        ":node_modules/@player-ui/reference-assets-plugin-components",
    ]
)
