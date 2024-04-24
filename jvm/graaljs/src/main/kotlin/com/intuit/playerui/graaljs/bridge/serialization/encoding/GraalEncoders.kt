package com.intuit.playerui.graaljs.bridge.serialization.encoding

import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.bridge.invokeVararg
import com.intuit.playerui.core.bridge.serialization.encoding.FunctionEncoder
import com.intuit.playerui.core.bridge.serialization.encoding.NodeEncoder
import com.intuit.playerui.core.bridge.serialization.json.isJsonElementSerializer
import com.intuit.playerui.core.bridge.serialization.json.value
import com.intuit.playerui.core.bridge.serialization.serializers.FunctionLikeSerializer
import com.intuit.playerui.core.bridge.serialization.serializers.GenericSerializer
import com.intuit.playerui.core.bridge.serialization.serializers.ThrowableSerializer
import com.intuit.playerui.graaljs.bridge.GraalNode
import com.intuit.playerui.graaljs.bridge.GraalObjectWrapper
import com.intuit.playerui.graaljs.bridge.serialization.format.GraalEncodingException
import com.intuit.playerui.graaljs.bridge.serialization.format.GraalFormat
import com.intuit.playerui.graaljs.bridge.serialization.format.encodeToGraalValue
import com.intuit.playerui.graaljs.extensions.blockingLock
import com.intuit.playerui.graaljs.extensions.handleValue
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
import org.graalvm.polyglot.Value
import org.graalvm.polyglot.proxy.ProxyExecutable
import kotlin.reflect.KCallable
import kotlin.reflect.KClass
import kotlin.reflect.full.isSubclassOf
import kotlin.reflect.full.valueParameters

internal fun <T> GraalFormat.writeValue(value: T, serializer: SerializationStrategy<T>): Value {
    lateinit var result: Value
    val encoder = GraalValueEncoder(this) { result = it }
    encoder.encodeSerializableValue(serializer, value)
    return result
}

internal open class GraalValueEncoder(private val format: GraalFormat, private val mode: Mode, private val consumer: (Value) -> Unit) :
    AbstractEncoder(),
    NodeEncoder,
    FunctionEncoder {

    internal constructor(format: GraalFormat, consumer: (Value) -> Unit) : this(format, Mode.UNDECIDED, consumer)

    override val serializersModule: SerializersModule by format::serializersModule

    enum class Mode {
        MAP,
        LIST,
        PRIMITIVE,
        UNDECIDED,
    }

    private val currentContent get() = when (mode) {
        Mode.MAP -> contentMap
        Mode.LIST -> contentList
        Mode.PRIMITIVE,
        Mode.UNDECIDED,
        -> content
    }

    private var tag: String? = null

    private var content: Value = format.context.blockingLock {
        eval("js", "undefined")
    }
        get() = when (mode) {
            Mode.UNDECIDED,
            Mode.PRIMITIVE,
            -> field
            else -> error("cannot get content unless in PRIMITIVE mode")
        }

    protected open val contentList = format.context.blockingLock {
        eval("js", "[]")
    }
        get() = when (mode) {
            Mode.LIST -> field
            else -> error("cannot get list unless in LIST mode")
        }

    protected open val contentMap = format.context.blockingLock {
        eval("js", "new Object()")
    }
        get() = when (mode) {
            Mode.MAP -> field
            else -> error("cannot get map unless in MAP mode")
        }

    override fun beginStructure(
        descriptor: SerialDescriptor,
    ): CompositeEncoder {
        val consumer = when (mode) {
            Mode.LIST,
            Mode.MAP,
            -> { node -> putContent(node) }
            Mode.PRIMITIVE,
            Mode.UNDECIDED,
            -> consumer
        }

        return if (descriptor == ThrowableSerializer().descriptor) {
            GraalExceptionEncoder(format, ::putContent)
        } else {
            when (descriptor.kind) {
                StructureKind.CLASS -> GraalValueEncoder(format, Mode.MAP, consumer)
                StructureKind.LIST, is PolymorphicKind -> GraalValueEncoder(format, Mode.LIST, consumer)
                StructureKind.MAP -> GraalValueEncoder(format, Mode.MAP, consumer)
                else -> GraalValueEncoder(format, consumer)
            }
        }
    }

    override fun endStructure(descriptor: SerialDescriptor): Unit = endEncode()
    protected fun endEncode() = consumer.invoke(currentContent)

    override fun encodeValue(value: Any) = putContent(
        when (value) {
            is GraalNode -> value.graalObject
            is Value -> value
            else -> value
        },
    )

    override fun encodeNull() = putContent(null)

    override fun encodeElement(descriptor: SerialDescriptor, index: Int): Boolean {
        if (descriptor.kind == StructureKind.CLASS) encodeString(descriptor.getElementName(index))
        return true
    }

    override fun encodeNode(value: Node): Unit = when (value) {
        is NodeWrapper -> encodeNode(value.node)
        is GraalObjectWrapper -> encodeValue(value.graalObject)
        else -> error("value of type ${value::class.simpleName} is not recognized as a Node")
    }

    override fun encodeFunction(invokable: Invokable<*>) = putContent(
        ProxyExecutable { args ->
            val encodedArgs = (args.indices)
                .map { args[it].handleValue(format) }
                .toTypedArray()

            format.encodeToGraalValue(invokable(*encodedArgs))
        },
    )

    override fun encodeFunction(kCallable: KCallable<*>) = putContent(
        ProxyExecutable { args ->
            val encodedArgs = (args.indices).map { args[it].handleValue(format) }
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
                        ) {
                            index++
                        } else {
                            break
                        }
                    }
                    // only take matching args
                    encodedArgs.slice(start until index).toTypedArray()
                } else {
                    // not matching arg types here, just relying on order
                    if (index in encodedArgs.indices) encodedArgs[index++] else null
                }
            }.toTypedArray()
            format.encodeToGraalValue(kCallable.call(*matchedArgs))
        },
    )

    override fun encodeFunction(function: Function<*>) {
        if (function is Invokable<*>) {
            encodeFunction(function)
        } else {
            val proxyExecutable = ProxyExecutable { args ->
                val encodedArgs = (args.indices).map { args[it].handleValue(format) }
                val arity = (function as kotlin.jvm.internal.FunctionBase<*>).arity
                val matchedArgs = (0 until arity)
                    .map { encodedArgs.getOrNull(it) }
                    .toTypedArray()
                format.encodeToGraalValue(function.invokeVararg(*matchedArgs))
            }
            putContent(proxyExecutable)
        }
    }

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
                } as T,
            )

            else -> super<AbstractEncoder>.encodeSerializableValue(serializer, value)
        }
    }

    private fun putContent(content: Any?) {
        when (mode) {
            Mode.LIST -> contentList.add(content)
            Mode.MAP -> when (val tag = tag) {
                null -> this.tag = content.toString()
                else -> putContent(tag, content)
            }
            Mode.PRIMITIVE,
            Mode.UNDECIDED,
            -> {
                this.content = format.context.asValue(content)
                endEncode()
            }
        }
    }

    private fun putContent(tag: String, content: Any?) {
        when (mode) {
            Mode.LIST -> contentList.add(content)
            Mode.MAP -> contentMap[tag] = content
            Mode.UNDECIDED,
            Mode.PRIMITIVE,
            -> {
                this.content = format.context.asValue(content)
                endEncode()
            }
        }
        this.tag = null
    }

    private fun Value.add(content: Any?) {
        if (this.hasArrayElements()) {
            blockingLock {
                this.setArrayElement(this.arraySize, content)
            }
        }
        val item = ""
    }

    private operator fun Value.set(key: String, content: Any?): Unit = blockingLock {
        when (content) {
            null -> putMember(key, null)
            Unit -> putMember(key, null)
            is Value,
            is ProxyExecutable,
            is String,
            is Boolean,
            is Double,
            is Int,
            is Long,
            -> putMember(key, content)
            else -> error("can't set property on Graal Value of type: ${content::class}")
        }
    }
}

internal class GraalExceptionEncoder(format: GraalFormat, consumer: (Value) -> Unit) : GraalValueEncoder(
    format,
    Mode.MAP,
    consumer,
) {

    override val contentMap by lazy {
        format.context.blockingLock {
            eval("js", "new Error()")
        }
    }

    override fun <T> encodeSerializableValue(serializer: SerializationStrategy<T>, value: T) {
        serializer.serialize(this, value)
    }
}

private inline fun error(message: String?, cause: Throwable? = null): Nothing = throw GraalEncodingException(message, cause)
