package com.intuit.player.jvm.core.bridge.serialization.serializers

import com.intuit.player.jvm.core.bridge.Node
import kotlinx.serialization.modules.PolymorphicModuleBuilder
import kotlinx.serialization.modules.SerializersModule
import kotlinx.serialization.modules.plus
import kotlinx.serialization.modules.polymorphic

public val playerSerializersModule: SerializersModule = SerializersModule {
    fun PolymorphicModuleBuilder<Throwable>.registerThrowableSerializers() {
        default {
            ThrowableSerializer()
        }
    }

    polymorphic(Throwable::class, ThrowableSerializer()) {
        registerThrowableSerializers()
    }

    polymorphic(Node::class, NodeSerializer()) {
        default { NodeSerializer() }
    }

    polymorphic(Any::class) {
        registerThrowableSerializers()

        subclass(Node::class, NodeSerializer())
    }

    contextual(Any::class, ::GenericSerializer)
    contextual(Throwable::class, ThrowableSerializer())
} + FunctionLikeSerializer.functionSerializerModule
