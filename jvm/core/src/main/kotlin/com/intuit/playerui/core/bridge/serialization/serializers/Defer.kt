package com.intuit.playerui.core.bridge.serialization.serializers

import com.intuit.playerui.core.utils.InternalPlayerApi
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.descriptors.SerialKind

/**
 * Returns serial descriptor that delegates all the calls to descriptor returned by [deferred] block.
 * Used to resolve cyclic dependencies between recursive serializable structures.
 *
 * Copied shamelessly from:
 * [JsonElementSerializers.kt](https://github.com/Kotlin/kotlinx.serialization/blob/8be6845927414a844ffebedc871dd8bc0d4b8aee/formats/json/commonMain/src/kotlinx/serialization/json/JsonElementSerializers.kt#L218)
 *
 * Awaiting input on [issue](https://github.com/Kotlin/kotlinx.serialization/issues/1815)
 */
@InternalPlayerApi
public fun defer(deferred: () -> SerialDescriptor): SerialDescriptor = object : SerialDescriptor {
    private val original: SerialDescriptor by lazy(deferred)

    override val serialName: String
        get() = original.serialName
    override val kind: SerialKind
        get() = original.kind
    override val elementsCount: Int
        get() = original.elementsCount

    override fun getElementName(index: Int): String = original.getElementName(index)

    override fun getElementIndex(name: String): Int = original.getElementIndex(name)

    override fun getElementAnnotations(index: Int): List<Annotation> = original.getElementAnnotations(index)

    override fun getElementDescriptor(index: Int): SerialDescriptor = original.getElementDescriptor(index)

    override fun isElementOptional(index: Int): Boolean = original.isElementOptional(index)
}
