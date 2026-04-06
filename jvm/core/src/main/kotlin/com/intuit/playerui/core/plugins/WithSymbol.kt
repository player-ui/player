package com.intuit.playerui.core.plugins

/**
 * Marker for [Plugin]s that can be looked up by their JS symbol.
 * Plugins implementing this interface expose a [symbol] expression that evaluates
 * to the plugin's JS symbol in the runtime, enabling lookup via the JS player's
 * findPlugin even when the plugin is not registered via a native [JSPluginWrapper].
 */
public interface WithSymbol {
    /** JS expression that evaluates to this plugin's symbol (e.g. "MetricsPlugin.symbol") */
    public val symbol: String
}
