package com.intuit.player.jvm.j2v8.extensions

import com.eclipsesource.v8.V8Array
import com.eclipsesource.v8.V8Function
import com.intuit.player.jvm.j2v8.bridge.serialization.format.J2V8Format

internal operator fun V8Function.invoke(): Any? =
    call(runtime, runtime.blockingLock(::V8Array))

internal operator fun V8Function.invoke(format: J2V8Format, vararg args: Any?): Any? =
    call(runtime, format.args(*args))
