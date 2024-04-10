package com.intuit.playerui.core.bridge.serialization.json

import com.intuit.playerui.core.bridge.serialization.serializers.GenericSerializer
import com.intuit.playerui.core.utils.InternalPlayerApi
import kotlinx.serialization.KSerializer
import kotlinx.serialization.json.Json
import kotlinx.serialization.modules.SerializersModule
import kotlinx.serialization.serializer

@InternalPlayerApi
public val PrettyJson: Json = Json {
    prettyPrint = true
    prettyPrintIndent = "  "
    serializersModule = SerializersModule {
        contextual(Any::class, GenericSerializer().conform())
    }
}

@InternalPlayerApi
public inline fun <reified T> T.prettify(serializer: KSerializer<T> = PrettyJson.serializersModule.serializer()): String = PrettyJson.encodeToString(serializer, this)

@InternalPlayerApi
public inline fun <reified T> T.prettyPrint(serializer: KSerializer<T> = PrettyJson.serializersModule.serializer(), printer: (String) -> Unit = ::println) {
    printer(prettify(serializer))
}
