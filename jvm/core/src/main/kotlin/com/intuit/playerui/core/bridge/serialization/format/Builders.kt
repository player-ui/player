package com.intuit.playerui.core.bridge.serialization.format

import com.intuit.playerui.core.utils.InternalPlayerApi
import kotlin.contracts.InvocationKind
import kotlin.contracts.contract

@DslMarker
public annotation class RuntimeBuilderDsl

@RuntimeBuilderDsl
public fun <T> RuntimeFormat<T>.runtimeObject(builder: RuntimeObjectBuilder<T>.() -> Unit): T =
    RuntimeObjectBuilder(this).apply(builder).build()

@RuntimeBuilderDsl
public fun <T> RuntimeFormat<T>.runtimeArray(builder: RuntimeArrayBuilder<T>.() -> Unit): T =
    RuntimeArrayBuilder(this).apply(builder).build()

@RuntimeBuilderDsl
public interface Builder<T> {
    public val format: RuntimeFormat<T>
}

@InternalPlayerApi
@RuntimeBuilderDsl
public class RuntimeObjectBuilder<T>(override val format: RuntimeFormat<T>) : Builder<T> {

    private val content: MutableMap<String, Any?> = linkedMapOf()

    public operator fun set(key: String, value: Any?) {
        content[key] = format.encodeToRuntimeValue(value)
    }

    public fun build(): T = format.encodeToRuntimeValue(content)
}

@InternalPlayerApi
@RuntimeBuilderDsl
public class RuntimeArrayBuilder<T>(override val format: RuntimeFormat<T>) : Builder<T> {

    private val content: MutableList<Any?> = arrayListOf()

    public fun append(value: Any?) {
        content.add(format.encodeToRuntimeValue(value))
    }

    public fun build(): T = format.encodeToRuntimeValue(content)
}

@RuntimeBuilderDsl
public fun <T> Builder<T>.runtimeObject(builder: RuntimeObjectBuilder<T>.() -> Unit): T {
    contract { callsInPlace(builder, InvocationKind.EXACTLY_ONCE) }
    return format.runtimeObject(builder)
}

@RuntimeBuilderDsl
public fun <T> Builder<T>.runtimeArray(builder: RuntimeArrayBuilder<T>.() -> Unit): T {
    contract { callsInPlace(builder, InvocationKind.EXACTLY_ONCE) }
    return format.runtimeArray(builder)
}
