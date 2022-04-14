package com.intuit.player.jvm.core.bridge.runtime

import java.util.*

/**
 * A container is searched across dependencies using [ServiceLoader] to find runtime implementations.
 * An implementation of this interface provides a [PlayerRuntimeFactory] and is only used
 * to find the default player runtime when no particular runtime implementation is specified
 */
public interface PlayerRuntimeContainer {
    public val factory: PlayerRuntimeFactory<*>
}
