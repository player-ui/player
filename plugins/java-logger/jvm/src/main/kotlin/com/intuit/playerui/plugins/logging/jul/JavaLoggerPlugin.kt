package com.intuit.playerui.plugins.logging.jul

import com.intuit.playerui.core.plugins.LoggerPlugin
import com.intuit.playerui.core.plugins.logging.PlayerLoggingConfig
import com.intuit.playerui.core.plugins.logging.PlayerLoggingContainer
import com.intuit.playerui.core.plugins.logging.PlayerLoggingFactory
import java.util.logging.Logger

/** Basic Java Logger player plugin */
public class JavaLoggerPlugin(
    public val config: JavaLoggerConfig,
) : LoggerPlugin {
    public val logger: Logger = Logger.getLogger(config.name).apply(config.logger)

    override fun trace(vararg args: Any?) {
        logger.finest(args.joinToString(","))
    }

    override fun debug(vararg args: Any?) {
        logger.fine(args.joinToString(","))
    }

    override fun info(vararg args: Any?) {
        logger.info(args.joinToString(","))
    }

    override fun warn(vararg args: Any?) {
        logger.warning(args.joinToString(","))
    }

    override fun error(vararg args: Any?) {
        logger.severe(args.joinToString(","))
    }
}

public class JavaLoggerConfig(
    override var name: String = "JavaLogger",
    public var logger: (Logger) -> Unit = {},
) : PlayerLoggingConfig()

public object JavaLoggerFactory : PlayerLoggingFactory<JavaLoggerConfig> {
    override fun create(block: JavaLoggerConfig.() -> Unit): JavaLoggerPlugin = JavaLoggerPlugin(JavaLoggerConfig().apply(block))

    override fun toString(): String = "JavaLogger"
}

public class JavaLoggingContainer : PlayerLoggingContainer {
    override val factory: PlayerLoggingFactory<*> = JavaLoggerFactory

    override fun toString(): String = "JavaLogger"
}
