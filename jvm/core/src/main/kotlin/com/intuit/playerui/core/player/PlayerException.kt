package com.intuit.playerui.core.player

import com.intuit.playerui.core.bridge.serialization.serializers.ThrowableSerializer
import kotlinx.serialization.Serializable

/** Generic exception for any errors encountered in the scope of the [Player] */
@Suppress("SERIALIZER_TYPE_INCOMPATIBLE")
@Serializable(ThrowableSerializer::class)
public open class PlayerException
    @JvmOverloads
    constructor(
        message: String,
        cause: Throwable? = null,
    ) : Exception(message, cause)
