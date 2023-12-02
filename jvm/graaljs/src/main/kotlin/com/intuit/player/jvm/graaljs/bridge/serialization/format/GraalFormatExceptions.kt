package com.intuit.playerui.graaljs.bridge.serialization.format

import com.intuit.playerui.core.bridge.serialization.format.RuntimeSerializationException
import com.intuit.playerui.core.utils.InternalPlayerApi

/** Generic exception indicating a problem with [GraalFormat] serialization and deserialization */
internal open class GraalSerializationException @InternalPlayerApi constructor(message: String?, cause: Throwable? = null) : RuntimeSerializationException(message, cause)

/** Thrown when [GraalFormat] has failed to parse the given JSON string or deserialize it to a target class */
internal class GraalDecodingException @InternalPlayerApi constructor(message: String?, cause: Throwable? = null) : GraalSerializationException(message, cause)

/** Thrown when [GraalFormat] has failed to create a JSON string from the given value */
internal class GraalEncodingException @InternalPlayerApi constructor(message: String?, cause: Throwable? = null) : GraalSerializationException(message, cause)
