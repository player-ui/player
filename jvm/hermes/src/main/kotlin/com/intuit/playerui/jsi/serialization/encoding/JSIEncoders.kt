package com.intuit.playerui.jsi.serialization.encoding

import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.bridge.serialization.encoding.FunctionEncoder
import com.intuit.playerui.core.bridge.serialization.encoding.NodeEncoder
import com.intuit.playerui.core.bridge.serialization.json.isJsonElementSerializer
import com.intuit.playerui.core.bridge.serialization.json.value
import com.intuit.playerui.core.bridge.serialization.serializers.FunctionLikeSerializer
import com.intuit.playerui.core.bridge.serialization.serializers.GenericSerializer
import com.intuit.playerui.core.bridge.serialization.serializers.ThrowableSerializer
import com.intuit.playerui.hermes.bridge.JSIValueWrapper
import com.intuit.playerui.jsi.Array
import com.intuit.playerui.jsi.Object
import com.intuit.playerui.jsi.Value
import com.intuit.playerui.jsi.serialization.format.JSIEncodingException
import com.intuit.playerui.jsi.serialization.format.JSIFormat
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

internal fun <T> JSIFormat.writeToValue(value: T, serializer: SerializationStrategy<T>): Value {
    lateinit var result: Value
    val encoder = JSIValueEncoder(this) { result = it }
    encoder.encodeSerializableValue(serializer, value)
    return result
}

internal open class JSIValueEncoder(private val format: JSIFormat, private val mode: Mode, private val consumer: (Value) -> Unit) :
    AbstractEncoder(),
    NodeEncoder,
    FunctionEncoder {

    internal constructor(format: JSIFormat, consumer: (Value) -> Unit) : this(format, Mode.UNDECIDED, consumer)

    override val serializersModule: SerializersModule by format::serializersModule

    enum class Mode {
        MAP,
        LIST,
        PRIMITIVE,
        UNDECIDED,
    }

    private val currentContent: Value get() = when (mode) {
        Mode.MAP -> contentMap.asValue()
        Mode.LIST -> Array.createWithElements(format.runtime, *contentList.toTypedArray()).asValue()
        Mode.PRIMITIVE,
        Mode.UNDECIDED,
        -> content
    }

    private var content: Value = Value.undefined()
        get() = when (mode) {
            Mode.UNDECIDED,
            Mode.PRIMITIVE,
            -> field
            else -> error("cannot get content unless in PRIMITIVE mode")
        }

    // NOTE: If JSI Array ever gets support for dynamic sizing, we can create one up front
    // TODO: If we pull out the common logic, we can just do List<Value> and serialize it :boom:
    protected open val contentList = mutableListOf<Value>()
        get() = when (mode) {
            Mode.LIST -> field
            else -> error("cannot get list unless in LIST mode")
        }

    protected open val contentMap = Object(format.runtime)
        get() = when (mode) {
            Mode.MAP -> field
            else -> error("cannot get map unless in MAP mode")
        }

    // TODO: Should really be a PropNameID to allow non-string keys
    private var tag: String? = null

    private fun putContent(content: Value) {
        when (mode) {
            Mode.LIST -> contentList.add(content)
            Mode.MAP -> when (val tag = tag) {
                null -> this.tag = content.toString()
                else -> {
                    contentMap.setProperty(format.runtime, tag, content)
                    this.tag = null
                }
            }
            Mode.PRIMITIVE,
            Mode.UNDECIDED,
            -> {
                this.content = content
                endEncode()
            }
        }
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
            V8ExceptionEncoder(format, ::putContent)
        } else {
            when (descriptor.kind) {
                StructureKind.CLASS -> JSIValueEncoder(format, Mode.MAP, consumer)
                StructureKind.LIST, is PolymorphicKind -> JSIValueEncoder(format, Mode.LIST, consumer)
                StructureKind.MAP -> JSIValueEncoder(format, Mode.MAP, consumer)
                else -> JSIValueEncoder(format, consumer)
            }
        }
    }

    override fun endStructure(descriptor: SerialDescriptor): Unit = endEncode()
    protected fun endEncode() = consumer.invoke(currentContent)

    override fun encodeValue(value: Any): Unit = putContent(
        when (value) {
            is Value -> value
            // this checks for everything we can, including wrappers
            else -> Value.from(format.runtime, value)
        }
    )

    override fun encodeNull(): Unit = putContent(Value.`null`())

    override fun encodeElement(descriptor: SerialDescriptor, index: Int): Boolean {
        if (descriptor.kind == StructureKind.CLASS) encodeString(descriptor.getElementName(index))
        return true
    }

    override fun encodeNode(value: Node): Unit = when (value) {
        // TODO: This can probably be consolidated with encodeValue impl
        is NodeWrapper -> encodeNode(value.node)
        is JSIValueWrapper -> encodeJSIValue(value.value)
        else -> error("value of type ${value::class.simpleName} is not recognized as a JSI based Node")
    }

    fun encodeJSIValue(value: Value): Unit = encodeValue(value)

    override fun <T> encodeSerializableValue(serializer: SerializationStrategy<T>, value: T) {
        when {
            // TODO: Reconcile this with Value.from(rt, v)
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

    override fun encodeFunction(invokable: Invokable<*>) = putContent(
        Value.from(format.runtime, invokable)
    )

    override fun encodeFunction(kCallable: KCallable<*>) = putContent(
        Value.from(format.runtime, kCallable)
    )

    override fun encodeFunction(function: Function<*>) = putContent(
        Value.from(format.runtime, function)
    )
}

// TODO: Likely just wrap JSIException
internal class V8ExceptionEncoder(format: JSIFormat, consumer: (Value) -> Unit) : JSIValueEncoder(format, Mode.MAP, consumer) {

    override val contentMap by lazy {
        format.runtime.global()
            .getPropertyAsFunction(format.runtime, "Error")
            .callAsConstructor(format.runtime)
            .asObject(format.runtime)
    }

    override fun <T> encodeSerializableValue(serializer: SerializationStrategy<T>, value: T) {
        serializer.serialize(this, value)
    }
}

private inline fun error(message: String?, cause: Throwable? = null): Nothing = throw JSIEncodingException(message, cause)
