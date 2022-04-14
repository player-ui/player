package com.intuit.player.jvm.core.bridge.serialization.format

import com.intuit.player.jvm.core.bridge.runtime.Runtime
import com.intuit.player.jvm.core.utils.InternalPlayerApi
import kotlinx.serialization.SerializationException

/** Generic exception indicating a problem with [Runtime] serialization and deserialization */
public open class RuntimeSerializationException @InternalPlayerApi constructor(message: String?, cause: Throwable? = null) : SerializationException(message, cause)

/** Thrown when [RuntimeFormat] has failed to parse the given JSON string or deserialize it to a target class */
public class RuntimeDecodingException @InternalPlayerApi constructor(message: String?, cause: Throwable? = null) : RuntimeSerializationException(message, cause)

/** Thrown when [RuntimeFormat] has failed to create a JSON string from the given value */
public class RuntimeEncodingException @InternalPlayerApi constructor(message: String?, cause: Throwable? = null) : RuntimeSerializationException(message, cause)
