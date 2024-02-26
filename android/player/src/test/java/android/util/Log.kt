@file:JvmName("Log")

package android.util

import com.intuit.playerui.android.utils.*

public var e: MutableList<String> = mutableListOf()
public fun e(tag: String, msg: String): Int {
    val message = "ERROR: $tag: $msg"
    e.add(message)
    println(message)
    return 0
}

public var w: MutableList<String> = mutableListOf()
public fun w(tag: String, msg: String): Int {
    val message = "WARN: $tag: $msg"
    w.add(message)
    println(message)
    return 0
}

public var i: MutableList<String> = mutableListOf()
public fun i(tag: String, msg: String): Int {
    val message = "INFO: $tag: $msg"
    i.add(message)
    println(message)
    return 0
}

public var d: MutableList<String> = mutableListOf()
public fun d(tag: String, msg: String): Int {
    val message = "DEBUG: $tag: $msg"
    d.add(message)
    println(message)
    return 0
}

public var v: MutableList<String> = mutableListOf()
public fun v(tag: String, msg: String): Int {
    val message = "TRACE: $tag: $msg"
    v.add(message)
    println(message)
    return 0
}

enum class Level {
    Error, Warn, Info, Debug, Verbose;

    fun getLogs(): List<String> = when (this) {
        Error -> e
        Warn -> w
        Info -> i
        Debug -> d
        Verbose -> v
    }
}
