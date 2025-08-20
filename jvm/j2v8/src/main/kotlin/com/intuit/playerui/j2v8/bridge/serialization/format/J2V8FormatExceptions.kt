package com.intuit.playerui.j2v8.bridge.serialization.format

import com.intuit.playerui.core.bridge.serialization.format.RuntimeSerializationException
import com.intuit.playerui.core.utils.InternalPlayerApi

/** Generic exception indicating a problem with [J2V8Format] serialization and deserialization */
internal open class J2V8SerializationException
    @InternalPlayerApi
    constructor(
        message: String?,
        cause: Throwable? = null,
    ) : RuntimeSerializationException(message, cause)

/** Thrown when [J2V8Format] has failed to parse the given JSON string or deserialize it to a target class */
internal class J2V8DecodingException
    @InternalPlayerApi
    constructor(
        message: String?,
        cause: Throwable? = null,
    ) : J2V8SerializationException(message, cause)

/** Thrown when [J2V8Format] has failed to create a JSON string from the given value */
internal class J2V8EncodingException
    @InternalPlayerApi
    constructor(
        message: String?,
        cause: Throwable? = null,
    ) : J2V8SerializationException(message, cause)
