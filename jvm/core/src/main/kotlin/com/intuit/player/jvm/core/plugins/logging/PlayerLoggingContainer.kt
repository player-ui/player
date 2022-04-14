package com.intuit.player.jvm.core.plugins.logging

import java.util.ServiceLoader

/**
 * A container is searched across dependencies using [ServiceLoader] to find runtime implementations.
 * An implementation of this interface provides a [PlayerLoggingFactory] and is only used
 * to find the default player runtime when no particular runtime implementation is specified
 */
public interface PlayerLoggingContainer {
    public val factory: PlayerLoggingFactory<*>
}
