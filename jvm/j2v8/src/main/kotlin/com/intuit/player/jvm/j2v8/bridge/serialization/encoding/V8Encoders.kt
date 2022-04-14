package com.intuit.player.jvm.j2v8.bridge.serialization.encoding

import com.eclipsesource.v8.*
import com.intuit.player.jvm.core.bridge.Invokable
import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.NodeWrapper
import com.intuit.player.jvm.core.bridge.invokeVararg
import com.intuit.player.jvm.core.bridge.serialization.encoding.FunctionEncoder
import com.intuit.player.jvm.core.bridge.serialization.encoding.NodeEncoder
import com.intuit.player.jvm.core.bridge.serialization.json.isJsonElementSerializer
import com.intuit.player.jvm.core.bridge.serialization.json.value
import com.intuit.player.jvm.core.bridge.serialization.serializers.FunctionLikeSerializer
import com.intuit.player.jvm.core.bridge.serialization.serializers.GenericSerializer
import com.intuit.player.jvm.core.bridge.serialization.serializers.ThrowableSerializer
import com.intuit.player.jvm.j2v8.*
import com.intuit.player.jvm.j2v8.bridge.V8Node
import com.intuit.player.jvm.j2v8.bridge.V8ObjectWrapper
import com.intuit.player.jvm.j2v8.bridge.serialization.format.J2V8EncodingException
import com.intuit.player.jvm.j2v8.bridge.serialization.format.J2V8Format
import com.intuit.player.jvm.j2v8.extensions.blockingLock
import com.intuit.player.jvm.j2v8.extensions.handleValue
import kotlinx.serialization.SerializationStrategy
import kotlinx.serialization.descriptors.PolymorphicKind
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.descriptors.StructureKind
import kotlinx.serialization.encoding.AbstractEncoder
import kotlinx.serialization.encoding.CompositeEncoder
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.modules.SerializersModule
import kotlin.reflect.KCallable
import kotlin.reflect.KClass
import kotlin.reflect.full.isSubclassOf
import kotlin.reflect.full.valueParameters

internal fun <T> J2V8Format.writeV8(value: T, serializer: SerializationStrategy<T>): V8Value {
    lateinit var result: V8Value
    val encoder = V8ValueEncoder(this) { result = it }
    encoder.encodeSerializableValue(serializer, value)
    return result
}

internal open class V8ValueEncoder(private val format: J2V8Format, private val mode: Mode, private val consumer: (V8Value) -> Unit) :
    AbstractEncoder(),
    NodeEncoder,
    FunctionEncoder {

    internal constructor(format: J2V8Format, consumer: (V8Value) -> Unit) : this(format, Mode.UNDECIDED, consumer)

    override val serializersModule: SerializersModule by format::serializersModule

    enum class Mode {
        MAP,
        LIST,
        PRIMITIVE,
        UNDECIDED
    }

    private val currentContent get() = when (mode) {
        Mode.MAP -> contentMap
        Mode.LIST -> contentList
        Mode.PRIMITIVE,
        Mode.UNDECIDED -> content
    }

    private var content: V8Value = V8.getUndefined()
        get() = when (mode) {
            Mode.UNDECIDED,
            Mode.PRIMITIVE -> field
            else -> error("cannot get content unless in PRIMITIVE mode")
        }

    protected open val contentList = format.v8.blockingLock(::V8Array)
        get() = when (mode) {
            Mode.LIST -> field
            else -> error("cannot get list unless in LIST mode")
        }

    protected open val contentMap = format.v8.blockingLock(::V8Object)
        get() = when (mode) {
            Mode.MAP -> field
            else -> error("cannot get map unless in MAP mode")
        }

    private var tag: String? = null

    private fun putContent(content: Any?) {
        when (mode) {
            Mode.LIST -> contentList.add(content)
            Mode.MAP -> when (val tag = tag) {
                null -> this.tag = content.toString()
                else -> putContent(tag, content)
            }
            Mode.PRIMITIVE,
            Mode.UNDECIDED -> {
                this.content = content as? V8Value ?: error("cannot set content (${content?.let { it::class }}) unless wrapped as V8Value")
                endEncode()
            }
        }
    }

    private operator fun V8Object.set(key: String, content: Any?): Unit = blockingLock {
        when (content) {
            null -> addNull(key)
            Unit -> addUndefined(key)
            is V8Primitive -> addPrimitive(key, content)
            is V8Value -> add(key, content)
            is String -> add(key, content)
            is Boolean -> add(key, content)
            is Double -> add(key, content)
            is Int -> add(key, content)
            is Long -> add(key, content.toDouble())
            else -> error("can't set property on V8Object of type: ${content::class}")
        }
    }

    private fun V8Array.add(content: Any?): Unit = blockingLock {
        when (content) {
            null -> pushNull()
            Unit -> pushUndefined()
            is V8Primitive -> pushPrimitive(content)
            is V8Value -> push(content)
            is String -> push(content)
            is Boolean -> push(content)
            is Double -> push(content)
            is Int -> push(content)
            is Long -> push(content.toDouble())
            else -> error("can't push property on V8Array of type: ${content::class}")
        }
    }

    private fun putContent(tag: String, content: Any?) {
        when (mode) {
            Mode.LIST -> contentList.add(content)
            Mode.MAP -> contentMap[tag] = content
            Mode.UNDECIDED,
            Mode.PRIMITIVE -> {
                this.content = content as? V8Value ?: error("cannot set content (${content?.let { it::class }}) unless wrapped as V8Value")
                endEncode()
            }
        }
        this.tag = null
    }

    override fun beginStructure(
        descriptor: SerialDescriptor
    ): CompositeEncoder {
        val consumer = when (mode) {
            Mode.LIST,
            Mode.MAP -> { node -> putContent(node) }
            Mode.PRIMITIVE,
            Mode.UNDECIDED -> consumer
        }

        return if (descriptor == ThrowableSerializer().descriptor)
            V8ExceptionEncoder(format, ::putContent)
        else when (descriptor.kind) {
            StructureKind.CLASS -> V8ValueEncoder(format, Mode.MAP, consumer)
            StructureKind.LIST, is PolymorphicKind -> V8ValueEncoder(format, Mode.LIST, consumer)
            StructureKind.MAP -> V8ValueEncoder(format, Mode.MAP, consumer)
            else -> V8ValueEncoder(format, consumer)
        }
    }

    override fun endStructure(descriptor: SerialDescriptor): Unit = endEncode()
    protected fun endEncode() = consumer.invoke(currentContent)

    override fun encodeValue(value: Any): Unit = putContent(
        when (value) {
            is V8Node -> value.v8Object
            is V8Value -> value
            else -> V8Value(value)
        }
    )

    override fun encodeNull(): Unit = putContent(V8Null)

    override fun encodeElement(descriptor: SerialDescriptor, index: Int): Boolean {
        if (descriptor.kind == StructureKind.CLASS) encodeString(descriptor.getElementName(index))
        return true
    }

    override fun encodeNode(value: Node): Unit = when (value) {
        is NodeWrapper -> encodeNode(value.node)
        is V8ObjectWrapper -> encodeV8Value(value.v8Object)
        else -> error("value of type ${value::class.simpleName} is not recognized as a Node")
    }

    fun encodeV8Value(value: V8Value): Unit = encodeValue(value)

    override fun <T> encodeSerializableValue(serializer: SerializationStrategy<T>, value: T) {
        when {
            serializer.descriptor == FunctionLikeSerializer.descriptor -> encodeFunction(value)
            value is Function<*> -> encodeFunction(value)
            value is KCallable<*> -> encodeFunction(value)
            value is Node -> encodeNode(value)
            value is NodeWrapper -> encodeNode(value.node)

            // JsonElement serializers do not support custom serializers, so we must
            // try to encode them using other serializers using the relevant serializers
            serializer.isJsonElementSerializer -> encodeSerializableValue(GenericSerializer(), value)
            value is JsonElement -> encodeSerializableValue(
                serializer,
                when (value) {
                    is JsonObject -> value.toMap()
                    is JsonArray -> value.toList()
                    is JsonPrimitive -> value.value
                    else -> value
                } as T
            )

            else -> super<AbstractEncoder>.encodeSerializableValue(serializer, value)
        }
    }

    override fun encodeFunction(invokable: Invokable<*>) = putContent(
        V8Function(format) { args ->
            val encodedArgs = (0 until args.length())
                .map { args[it].handleValue(format) }
                .toTypedArray()

            invokable(*encodedArgs)
        }
    )

    /**
     * Create [V8Function] from [KCallable]. Automatically trims or pads the args
     * such that the function is called with the correct number of arguments. However,
     * this will fail if the function parameter types are non-nullable. Attempts to
     * handle vararg parameters, but fails unless vararg is of type Any or Any? and
     * is the last expected parameter.
     *
     * TODO: It seems as though this only works for varargs of type Any and as a
     *  consequence it will eat up remaining parameters, so the vararg param must
     *  be the last param. Potential to look backwards as well to pull out values
     *  that match expected param types after the vararg.
     */
    override fun encodeFunction(kCallable: KCallable<*>) = putContent(
        V8Function(format) { args ->
            val encodedArgs = (0 until args.length())
                .map { args[it].handleValue(format) }
            var index = 0
            val matchedArgs = kCallable.valueParameters.map { kParam ->
                // vararg support, all input args of that type will be included in vararg array
                if (kParam.isVararg) {
                    val start = index
                    while (index in encodedArgs.indices) {
                        val currValue = encodedArgs.getOrNull(index)

                        // check if type is nullable and value is null
                        if ((
                            currValue == null &&
                                // base type or type argument could be marked nullable
                                (kParam.type.isMarkedNullable || kParam.type.arguments[0].type?.isMarkedNullable == true)
                            ) ||
                            // otherwise check if arg matches type if not null
                            (currValue != null && currValue::class.isSubclassOf(kParam.type.arguments[0].type?.classifier as KClass<*>))
                        )
                            index++
                        else break
                    }
                    // only take matching args
                    encodedArgs.slice(start until index).toTypedArray()
                } else {
                    // not matching arg types here, just relying on order
                    if (index in encodedArgs.indices) encodedArgs[index++] else null
                }
            }.toTypedArray()

            handleInvocation(kCallable::class, matchedArgs) {
                kCallable.call(*it)
            }
        }
    )

    /**
     * Create [V8Function] from [Function]. Currently, uses the awful [invokeVararg]
     * method to dynamically invoke the function. Automatically trims or pads the args
     * such that the function is called with the correct number of arguments. However,
     * this will fail if the function parameter types are non-nullable.
     *
     * @exception RuntimeException
     *
     * TODO: I want to use reflection so bad so I don't
     *  need to keep the stupid [invokeVararg] function
     *  around. But I'm having issues with access modifiers,
     *  and need to move on for now. I will come back
     *  and fix this at some point. Maybe by then,
     *  [kotlin.reflect.jvm.reflect] will supply a proper
     *  implementation of [KCallable.call] so that we
     *  don't even need to use Java reflection. Until then...
     */
    override fun encodeFunction(function: Function<*>) = if (function is Invokable<*>) encodeFunction(function) else putContent(
        V8Function(format) { args ->
            val encodedArgs = (0 until args.length())
                .map { args[it].handleValue(format) }

            // Hate that we need to look at an internal class for arity
            val arity = (function as kotlin.jvm.internal.FunctionBase<*>).arity

            // trim and pad args to fit arity constraints,
            // note that padding will fail if arg types are non-nullable
            val matchedArgs = (0 until arity)
                .map { encodedArgs.getOrNull(it) }
                .toTypedArray()

            handleInvocation(function::class, matchedArgs) {
                function.invokeVararg(*it)
            }
        }
    )

    private fun handleInvocation(reference: KClass<*>, args: Array<Any?>, block: (Array<Any?>) -> Any?) = try {
        block(args)
    } catch (e: Throwable) {
        when (e) {
            is IllegalArgumentException, is ClassCastException ->
                error("arguments passed to $reference do not conform:\n${args.toList()}", e)
            else -> throw e
        }
    }
}

internal class V8ExceptionEncoder(format: J2V8Format, consumer: (V8Value) -> Unit) : V8ValueEncoder(format, Mode.MAP, consumer) {

    override val contentMap by lazy {
        format.v8.blockingLock {
            executeObjectScript("""(new Error())""")
        }
    }

    override fun <T> encodeSerializableValue(serializer: SerializationStrategy<T>, value: T) {
        serializer.serialize(this, value)
    }
}

private inline fun error(message: String?, cause: Throwable? = null): Nothing = throw J2V8EncodingException(message, cause)
