@file:JvmName("Log")

package android.util

internal var e: String? = null
internal fun e(tag: String, msg: String): Int {
    e = "ERROR: $tag: $msg"
    println(e)
    return 0
}

internal var w: String? = null
internal fun w(tag: String, msg: String): Int {
    w = "WARN: $tag: $msg"
    println(w)
    return 0
}

internal var i: String? = null
internal fun i(tag: String, msg: String): Int {
    i = "INFO: $tag: $msg"
    println(i)
    return 0
}

internal var d: String? = null
internal fun d(tag: String, msg: String): Int {
    d = "DEBUG: $tag: $msg"
    println(d)
    return 0
}

internal var t: String? = null
internal fun t(tag: String, msg: String): Int {
    d = "DEBUG: $tag: $msg"
    println(d)
    return 0
}
