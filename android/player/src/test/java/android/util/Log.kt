@file:JvmName("Log")

package android.util

var e: MutableList<String> = mutableListOf()
fun e(tag: String, msg: String): Int {
    val message = "ERROR: $tag: $msg"
    e.add(message)
    println(message)
    return 0
}

var w: MutableList<String> = mutableListOf()
fun w(tag: String, msg: String): Int {
    val message = "WARN: $tag: $msg"
    w.add(message)
    println(message)
    return 0
}

var i: MutableList<String> = mutableListOf()
fun i(tag: String, msg: String): Int {
    val message = "INFO: $tag: $msg"
    i.add(message)
    println(message)
    return 0
}

var d: MutableList<String> = mutableListOf()
fun d(tag: String, msg: String): Int {
    val message = "DEBUG: $tag: $msg"
    d.add(message)
    println(message)
    return 0
}

var v: MutableList<String> = mutableListOf()
fun v(tag: String, msg: String): Int {
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
