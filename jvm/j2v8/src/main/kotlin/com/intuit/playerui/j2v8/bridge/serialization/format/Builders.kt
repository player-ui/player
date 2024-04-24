package com.intuit.playerui.j2v8.bridge.serialization.format

import com.eclipsesource.v8.V8Array
import com.eclipsesource.v8.V8Object
import com.eclipsesource.v8.V8Value
import com.intuit.playerui.core.bridge.serialization.format.RuntimeArrayBuilder
import com.intuit.playerui.core.bridge.serialization.format.RuntimeBuilderDsl
import com.intuit.playerui.core.bridge.serialization.format.RuntimeObjectBuilder
import com.intuit.playerui.core.bridge.serialization.format.runtimeObject
import com.intuit.playerui.j2v8.v8Array
import com.intuit.playerui.j2v8.v8Object
import kotlin.contracts.InvocationKind
import kotlin.contracts.contract

@RuntimeBuilderDsl
public fun J2V8Format.v8Object(builder: RuntimeObjectBuilder<V8Value>.() -> Unit): V8Object {
    contract { callsInPlace(builder, InvocationKind.EXACTLY_ONCE) }
    return RuntimeObjectBuilder(this).apply(builder).build().v8Object
}

@RuntimeBuilderDsl
public fun RuntimeObjectBuilder<V8Value>.v8Object(builder: RuntimeObjectBuilder<V8Value>.() -> Unit): V8Object {
    contract { callsInPlace(builder, InvocationKind.EXACTLY_ONCE) }
    return runtimeObject(builder).v8Object
}

@RuntimeBuilderDsl
public fun J2V8Format.v8Array(builder: RuntimeArrayBuilder<V8Value>.() -> Unit): V8Array {
    contract { callsInPlace(builder, InvocationKind.EXACTLY_ONCE) }
    return RuntimeArrayBuilder(this).apply(builder).build().v8Array
}

@RuntimeBuilderDsl
public fun RuntimeObjectBuilder<V8Value>.v8Array(builder: RuntimeObjectBuilder<V8Value>.() -> Unit): V8Array {
    contract { callsInPlace(builder, InvocationKind.EXACTLY_ONCE) }
    return runtimeObject(builder).v8Array
}
