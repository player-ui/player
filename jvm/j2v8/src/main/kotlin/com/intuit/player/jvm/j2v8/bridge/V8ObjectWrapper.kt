package com.intuit.player.jvm.j2v8.bridge

import com.eclipsesource.v8.V8Object

/**
 * Ceremonial interface that denotes if a structure is
 * providing functionality on top of a [V8Object] instance
 */
// TODO: Consider making this abstract and overriding equals and hashcode
internal interface V8ObjectWrapper {
    val v8Object: V8Object

    fun release() {
        v8Object.close()
    }
}
