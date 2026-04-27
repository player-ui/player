package com.intuit.playerui.core.error

import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.bridge.hooks.NodeSyncBailHook1
import com.intuit.playerui.core.bridge.serialization.serializers.NodeSerializableField
import com.intuit.playerui.core.bridge.serialization.serializers.NodeSerializableFunction
import com.intuit.playerui.core.bridge.serialization.serializers.NodeWrapperSerializer
import com.intuit.playerui.core.bridge.serialization.serializers.ThrowableSerializer
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.serializer

/** Severity levels for errors */
@Serializable
public enum class ErrorSeverity(
    public val value: String,
) {
    /** Cannot continue, flow must end */
    @SerialName("fatal")
    FATAL("fatal"),

    /** Standard error, may allow recovery */
    @SerialName("error")
    ERROR("error"),

    /** Non-blocking, logged for telemetry */
    @SerialName("warning")
    WARNING("warning"),
}

/** Known error types for Player */
@Serializable
public enum class ErrorTypes(
    public val value: String,
) {
    @SerialName("expression")
    EXPRESSION("expression"),

    @SerialName("binding")
    BINDING("binding"),

    @SerialName("view")
    VIEW("view"),

    @SerialName("asset")
    ASSET("asset"),

    @SerialName("navigation")
    NAVIGATION("navigation"),

    @SerialName("validation")
    VALIDATION("validation"),

    @SerialName("data")
    DATA("data"),

    @SerialName("schema")
    SCHEMA("schema"),

    @SerialName("network")
    NETWORK("network"),

    @SerialName("plugin")
    PLUGIN("plugin"),

    @SerialName("render")
    RENDER("render"),
}

/**
 * Limited definition of the player error controller to enable error capture and management
 */
@Serializable(with = ErrorController.Serializer::class)
public class ErrorController internal constructor(
    override val node: Node,
) : NodeWrapper {
    private val captureError: (error: Throwable) -> Boolean by NodeSerializableFunction<Boolean>()
    private val getCurrentError: () -> Throwable? by NodeSerializableFunction<Throwable?>()
    private val getErrors: () -> List<Throwable>? by NodeSerializableFunction<List<Throwable>?>()
    private val clearErrors: () -> Unit by NodeSerializableFunction<Unit>()
    private val clearCurrentError: () -> Unit by NodeSerializableFunction<Unit>()

    public val hooks: Hooks by NodeSerializableField(Hooks.serializer())

    /**
     * Capture an error
     * @param error The error/exception object
     * @return Whether the error was handled
     */
    public fun captureError(error: Throwable): Boolean = captureError.invoke(error)

    /**
     * Get the most recent error
     * @return The current error if one exists
     */
    public fun getCurrentError(): Throwable? = getCurrentError.invoke()

    /**
     * Get the complete error history
     * @return List of all captured errors in chronological order
     */
    public fun getErrors(): List<Throwable>? = getErrors.invoke()

    /**
     * Clear all errors (history + current + data model)
     */
    public fun clearErrors() {
        clearErrors.invoke()
    }

    /**
     * Clear only current error and remove from data model, preserve history
     */
    public fun clearCurrentError() {
        clearCurrentError.invoke()
    }

    @Serializable(Hooks.Serializer::class)
    public class Hooks internal constructor(
        override val node: Node,
    ) : NodeWrapper {
        /**
         * Fired when any error is captured
         * - The callback receives a PlayerErrorInfo object
         * - Return true from the callback to bail and prevent error state navigation
         * - Return false/null to continue to next handler
         */
        public val onError: NodeSyncBailHook1<Throwable, Boolean>
            by NodeSerializableField(NodeSyncBailHook1.serializer(ThrowableSerializer(), Boolean.serializer()))

        internal object Serializer : NodeWrapperSerializer<Hooks>(::Hooks)
    }

    internal object Serializer : NodeWrapperSerializer<ErrorController>(::ErrorController)
}
