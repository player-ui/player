package com.intuit.player.jvm.utils

import com.intuit.player.jvm.core.bridge.serialization.serializers.ThrowableSerializer.SerializableStackTraceElement
import com.intuit.player.jvm.core.utils.InternalPlayerApi

/** Make a collection of [StackTraceElement]s subject to element equality */
@InternalPlayerApi
public fun Array<StackTraceElement>.normalizeStackTraceElements(): List<SerializableStackTraceElement> = map { stackTraceElement ->
    SerializableStackTraceElement(
        stackTraceElement.className,
        stackTraceElement.methodName,
        stackTraceElement.fileName,
        stackTraceElement.lineNumber,
    )
}
