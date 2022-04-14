package com.intuit.player.jvm.utils.test

import com.intuit.player.jvm.core.plugins.LoggerPlugin

public object TestLogger : LoggerPlugin {
    override fun trace(vararg args: Any?): Unit = print("TRACE", *args)
    override fun debug(vararg args: Any?): Unit = print("DEBUG", *args)
    override fun info(vararg args: Any?): Unit = print("INFO", *args)
    override fun warn(vararg args: Any?): Unit = print("WARN", *args)
    override fun error(vararg args: Any?): Unit = print("ERROR", *args)
    private fun print(level: String, vararg args: Any?) = println("$level: ${args.joinToString()}")
}
