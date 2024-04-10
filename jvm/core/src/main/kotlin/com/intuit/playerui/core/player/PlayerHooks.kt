package com.intuit.playerui.core.player

@Deprecated(
    "Abstracted by Player.Hooks interface, the old implementation of Node-backed hooks is within Player.Hooks.Companion as an anonymous object",
    ReplaceWith("Player.Hooks"),
    DeprecationLevel.ERROR,
)
public typealias PlayerHooks = Player.Hooks
