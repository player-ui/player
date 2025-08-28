package com.intuit.playerui.plugins.logging.slf4j

import com.intuit.playerui.core.plugins.LoggerPlugin
import com.intuit.playerui.core.plugins.logging.PlayerLoggingConfig
import com.intuit.playerui.core.plugins.logging.PlayerLoggingContainer
import com.intuit.playerui.core.plugins.logging.PlayerLoggingFactory
import org.slf4j.Logger
import org.slf4j.LoggerFactory

/** Basic Slf4j Java Logger player plugin */
public class Slf4jLoggerPlugin(
    public val config: Slf4jLoggerConfig,
) : LoggerPlugin {
    public val logger: Logger = LoggerFactory.getLogger(config.name)

    override fun trace(vararg args: Any?) {
        logger.trace(args.joinToString(","))
    }

    override fun debug(vararg args: Any?) {
        logger.debug(args.joinToString(","))
    }

    override fun info(vararg args: Any?) {
        logger.info(args.joinToString(","))
    }

    override fun warn(vararg args: Any?) {
        logger.warn(args.joinToString(","))
    }

    override fun error(vararg args: Any?) {
        logger.error(args.joinToString(","))
    }
}

public class Slf4jLoggerConfig(
    override var name: String = "Slf4jLogger",
    public var logger: (Logger) -> Unit = {},
) : PlayerLoggingConfig()

public object Slf4jLoggerFactory : PlayerLoggingFactory<Slf4jLoggerConfig> {
    override fun create(block: Slf4jLoggerConfig.() -> Unit): Slf4jLoggerPlugin = Slf4jLoggerPlugin(Slf4jLoggerConfig().apply(block))

    override fun toString(): String = "Slf4jLogger"
}

public class Slf4jLoggingContainer : PlayerLoggingContainer {
    override val factory: PlayerLoggingFactory<*> = Slf4jLoggerFactory

    override fun toString(): String = "Slf4jLogger"
}
