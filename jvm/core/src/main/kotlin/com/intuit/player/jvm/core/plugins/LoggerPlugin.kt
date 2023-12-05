package com.intuit.player.jvm.core.plugins

import com.intuit.player.jvm.core.player.Player

/** Player logger interface */
public interface LoggerPlugin : PlayerPlugin {
    public fun trace(vararg args: Any?)
    public fun debug(vararg args: Any?)
    public fun info(vararg args: Any?)
    public fun warn(vararg args: Any?)
    public fun error(vararg args: Any?)

    override fun apply(player: Player) {}
}

/** Convenience getter to find the first [LoggerPlugin] registered to the [Pluggable] */
public val Pluggable.logger: LoggerPlugin? get() = plugins
    .filterIsInstance<LoggerPlugin>()
    .firstOrNull()
