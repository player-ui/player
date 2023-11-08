@file:JvmName("Log")

package android.util

internal var e: MutableList<String> = mutableListOf()
internal fun e(tag: String, msg: String): Int {
    val message = "ERROR: $tag: $msg"
    e.add(message)
    println(message)
    return 0
}

internal var w: MutableList<String> = mutableListOf()
internal fun w(tag: String, msg: String): Int {
    val message = "WARN: $tag: $msg"
    w.add(message)
    println(message)
    return 0
}

internal var i: MutableList<String> = mutableListOf()
internal fun i(tag: String, msg: String): Int {
    val message = "INFO: $tag: $msg"
    i.add(message)
    println(message)
    return 0
}

internal var d: MutableList<String> = mutableListOf()
internal fun d(tag: String, msg: String): Int {
    val message = "DEBUG: $tag: $msg"
    d.add(message)
    println(message)
    return 0
}

internal var v: MutableList<String> = mutableListOf()
internal fun v(tag: String, msg: String): Int {
    val message = "TRACE: $tag: $msg"
    v.add(message)
    println(message)
    return 0
}

internal fun clearLogs() = listOf(e, w, i, d, v).forEach { it.clear() }
