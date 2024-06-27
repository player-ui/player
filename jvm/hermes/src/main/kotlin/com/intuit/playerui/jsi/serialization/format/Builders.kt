package com.intuit.playerui.jsi.serialization.format

import com.intuit.playerui.core.bridge.serialization.format.RuntimeArrayBuilder
import com.intuit.playerui.core.bridge.serialization.format.RuntimeBuilderDsl
import com.intuit.playerui.core.bridge.serialization.format.RuntimeObjectBuilder
import com.intuit.playerui.core.bridge.serialization.format.runtimeObject
import com.intuit.playerui.jsi.Array
import com.intuit.playerui.jsi.Object
import com.intuit.playerui.jsi.Runtime
import com.intuit.playerui.jsi.Value
import kotlin.contracts.InvocationKind
import kotlin.contracts.contract

@RuntimeBuilderDsl
public fun JSIFormat.`object`(builder: RuntimeObjectBuilder<Value>.() -> Unit): Object {
    contract { callsInPlace(builder, InvocationKind.EXACTLY_ONCE) }
    return RuntimeObjectBuilder(this).apply(builder).build().asObject(runtime)
}

@RuntimeBuilderDsl
public fun RuntimeObjectBuilder<Value>.`object`(builder: RuntimeObjectBuilder<Value>.() -> Unit): Object {
    contract { callsInPlace(builder, InvocationKind.EXACTLY_ONCE) }
    return runtimeObject(builder).asObject(format.runtime as Runtime)
}

@RuntimeBuilderDsl
public fun JSIFormat.array(builder: RuntimeArrayBuilder<Value>.() -> Unit): Array {
    contract { callsInPlace(builder, InvocationKind.EXACTLY_ONCE) }
    return RuntimeArrayBuilder(this).apply(builder).build().asObject(runtime).asArray(runtime)
}

@RuntimeBuilderDsl
public fun RuntimeObjectBuilder<Value>.array(builder: RuntimeObjectBuilder<Value>.() -> Unit): Array {
    contract { callsInPlace(builder, InvocationKind.EXACTLY_ONCE) }
    return runtimeObject(builder).asObject(format.runtime as Runtime).asArray(format.runtime as Runtime)
}
