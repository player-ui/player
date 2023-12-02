package com.intuit.playerui.j2v8.extensions

import com.eclipsesource.v8.V8Array
import com.intuit.playerui.j2v8.V8Array
import com.intuit.playerui.j2v8.bridge.serialization.format.J2V8Format
import com.intuit.playerui.j2v8.bridge.serialization.format.encodeToV8Value
import com.intuit.playerui.j2v8.v8Array

/** Convenience helper for building an empty [V8Array] for V8 function calls */
internal fun J2V8Format.emptyArgs(): V8Array = v8.V8Array()

/** Convenience helper for building an empty [V8Array] for V8 function calls */
internal fun J2V8Format.args(): V8Array = emptyArgs()

/** Convenience helper for building a [V8Array] from a collection of values for V8 function calls */
internal inline fun <reified T> J2V8Format.args(vararg values: T): V8Array = encodeToV8Value(values).v8Array
