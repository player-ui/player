package com.intuit.playerui.jsi.serialization.format

import com.intuit.playerui.core.bridge.serialization.format.RuntimeSerializationException
import com.intuit.playerui.core.utils.InternalPlayerApi

/** Generic exception indicating a problem with [JSIFormat] serialization and deserialization */
internal open class JSISerializationException @InternalPlayerApi constructor(message: String?, cause: Throwable? = null) : RuntimeSerializationException(message, cause)

/** Thrown when [JSIFormat] has failed to parse the given JSON string or deserialize it to a target class */
internal class JSIDecodingException @InternalPlayerApi constructor(message: String?, cause: Throwable? = null) : JSISerializationException(message, cause)

/** Thrown when [JSIFormat] has failed to create a JSON string from the given value */
internal class JSIEncodingException @InternalPlayerApi constructor(message: String?, cause: Throwable? = null) : JSISerializationException(message, cause)
